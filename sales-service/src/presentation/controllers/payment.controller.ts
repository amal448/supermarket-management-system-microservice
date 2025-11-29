import { Request, Response } from "express";
import Stripe from "stripe";
import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
export const saleRepo = new SaleRepository();

export const stripeWebhook = async(req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.log("Webhook signature error", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const saleId = session.metadata?.saleId;
    if (saleId) {
     await saleRepo.updateStatus(saleId, "COMPLETED");

    }
  }

  res.json({ received: true });
};
