import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";
import { processCompletedSale } from "../../application/services/salesWebhook.service";

const saleRepo = new SaleRepository();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) return res.status(400).send("Missing Stripe signature");

  let event: Stripe.Event;

  try {
    const payload = req.body as Buffer; // must use raw body parser
    console.log("stripeWebhook is called", payload);
    console.log("Stripe event data:", JSON.parse(payload.toString()));

    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.log("Webhook signature error", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const saleId = session.metadata?.saleId!;
        const branchId = session.metadata?.branchId!;
        const cashierId = session.metadata?.cashierId!;
        const items = JSON.parse(session.metadata?.cartResult || "[]");
        const finalAmount = (session.amount_total ?? 0) / 100;

        if (saleId) {
          // update sale status
          await saleRepo.updateStatus(saleId, "COMPLETED");

          // trigger all post-sale logic
          await processCompletedSale({
            saleId,
            branchId,
            cashierId,
            items,
            finalAmount
          });
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }
    }
  } catch (err) {
    console.error("Error processing sale after Stripe webhook:", err);
    return res.status(500).send("Internal Server Error");
  }

  res.json({ received: true });
};
