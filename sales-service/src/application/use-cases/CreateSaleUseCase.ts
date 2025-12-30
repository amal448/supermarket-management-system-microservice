import { DiscountRepository } from "../../infrastructure/repositories/DiscountRepository";
import { calculateCart } from "../../utils/discountEngine";
import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";
import { SaleItemRepository } from "../../infrastructure/repositories/SaleItemRepository";
import Stripe from "stripe";
import { sendAnalyticsUpdatedEvent, sendDashboardUpdateEvent, sendSaleCompletedEvent } from "../../kafka/producer";
import { SaleItemEntity } from "../../domain/entities/SaleItem";
import axios from "axios";
import { getSalesSummary } from "./GetSalesUseCase";
import { getIO } from "../services/socket.service";
import { SalesService } from "../services/sales.service";

const discountRepo = new DiscountRepository();
const saleRepo = new SaleRepository();
const saleItemRepo = new SaleItemRepository();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const salesservice = new SalesService(saleRepo);

export class CheckoutUseCase {

  // Utility to avoid NaN
  private safeNum(value: any): number {
    return typeof value === "number" && !isNaN(value) ? value : 0;
  }

  // -----------------------------------------------------------
  // 🟦 1) CALCULATE CART
  // -----------------------------------------------------------
  async calculate(
    items: { productId: string; category?: string; unitPrice: number; quantity: number }[]
  ) {
    const safe = this.safeNum;

    const cartItems = items.map(i => ({
      productId: i.productId,
      category: i.category,
      unitPrice: safe(i.unitPrice),       // ensure valid number
      quantity: safe(i.quantity)
    }));

    const cartResult = await calculateCart(
      cartItems,

      // ---------- FIX #1: MAP TO EXPECTED ProductDiscount ----------
      async (productId, category) => {
        const list = await discountRepo.findApplicable(productId, category);

        return list.map(x => ({
          id: x.id!,
          name: x.name,
          type: x.type as any,
          productId: x.productId!,
          buyQty: safe(x.buyQty),
          getQty: safe(x.getQty),
          flatAmount: safe(x.flatAmount),
          percentage: safe(x.percentage),
          isActive: x.isActive,
          startDate: x.startDate,
          endDate: x.endDate
        }));
      },

      // ---------- FIX #2: MAP CartDiscount ----------
      async () => {
        const cd = await discountRepo.findActiveCartDiscount();
        if (!cd) return null;

        return {
          id: cd.id!,
          name: cd.name,
          type: cd.type as any,
          minPurchaseAmount: safe(cd.minPurchaseAmount),
          flatAmount: safe(cd.flatAmount),
          percentage: safe(cd.percentage),
          isActive: cd.isActive
        };
      }
    );

    return cartResult;
  }

  // -----------------------------------------------------------
  // 🟩 2) CONFIRM SALE
  // -----------------------------------------------------------
  async confirmSale(payload: {
    branchId: string;
    cashierId: string;
    cartResult: any;
    paymentMode?: string;
    token?: string; // add this
  }) {
    const { branchId, cashierId, cartResult, paymentMode, token } = payload;
    // console.log("cartResult.lines", cartResult); 

    const safe = this.safeNum;
    const safePaymentMode =
      (paymentMode as "CASH" | "CARD" | "UPI" | undefined) ?? undefined;

    // 🟦 Create Sale Document
    const discountsApplied = cartResult.lines
      .filter((item: any) => item.appliedDiscountType) // ⬅️ Remove null entries
      .map((item: any) => ({
        productId: item.productId,
        appliedDiscountType: item.appliedDiscountType,
        appliedDiscountName: item.appliedDiscountName,
        appliedDiscountAmount: item.appliedDiscountAmount,
        freeUnits: item.freeUnits,
      }));

    console.log(" BEFORE creating Sale");

    // BEFORE creating Sale
    try {
      const isStockValid = await axios.post(
        "http://localhost:5003/api/inventory/check/branch-stock",
        {
          branchId,
          items: cartResult.lines.map((l: { productId: string; quantity: number; freeUnits?: number }) => ({
            productId: l.productId,
            qty: l.quantity,
            freeUnits: l.freeUnits ?? 0
          }))
        },
        {
          withCredentials: false,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("isStockValidisStockValid", isStockValid.data);

      if (!isStockValid.data.ok) {
        throw new Error("Stock not sufficient for one or more items");
      }

    }
    catch (error) {
      console.log(error);

    }

    const { sale } = await saleRepo.create({
      branchId,
      cashierId,
      subtotal: safe(cartResult.subtotal),
      productDiscount: safe(cartResult.totalProductDiscount),
      cartDiscount: safe(cartResult.cartDiscount),
      totalDiscount: safe(cartResult.totalDiscount),
      finalAmount: safe(cartResult.finalAmount),
      discountsApplied: discountsApplied,
      status: "COMPLETED",
      paymentMode: safePaymentMode
    });

    // 🟦 Create Sale Items
    const itemsToInsert: SaleItemEntity[] = cartResult.lines.map((l: any) => ({
      saleId: sale._id!,
      productId: l.productId,
      unitPrice: safe(l.unitPrice),
      quantity: safe(l.quantity),
      appliedDiscountName: l.appliedDiscountName ?? null,
      appliedDiscountAmount: safe(l.appliedDiscountAmount),
      freeUnits: safe(l.freeUnits),
      total: safe(l.lineTotal)
    }));

    await saleItemRepo.createMany(itemsToInsert);


    // // After saving sale & items
    // const summary = await new getSalesSummary(saleRepo).execute();

    // 1️⃣ Branch Summary (only this branch)
    const branchSummary = await new getSalesSummary(saleRepo).execute(branchId);

    await sendDashboardUpdateEvent({
      type: "BRANCH_UPDATE",
      branchId,
      summary: branchSummary
    });

    // 2️⃣ Global Summary (admin dashboard)
    const globalSummary = await new getSalesSummary(saleRepo).execute();

    await sendDashboardUpdateEvent({
      type: "GLOBAL_UPDATE",
      summary: globalSummary
    });


    //kafa data and topic emitted passed from producer
    console.log("kafka start;");
    await sendSaleCompletedEvent({
      saleId: sale._id,
      branchId,
      cashierId,
      items: itemsToInsert.map((i) => ({
        productId: i.productId,
        qty: Number(i.quantity),
        freeUnits: Number(i.freeUnits) ?? 0,
      })),
      finalAmount: sale.finalAmount,
      timestamp: new Date().toISOString(),
    });
    // After saving sale & items ****************
    const analytics = await salesservice.getAnalytics(
      payload.branchId,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1), // start of month
      new Date(), // end date
      "daily"
    );

    // Emit sales analytics event
    await sendAnalyticsUpdatedEvent(analytics);

    console.log("Kafka event sales.completed sent");
    return { sale, items: itemsToInsert };
  }

 async createStripeCheckoutSession(payload: { branchId: string; cashierId: string; cartResult: any }) {
  const { branchId, cashierId, cartResult } = payload;
  console.log("createStripeCheckoutSession", cartResult);

  // 1️⃣ Create Sale (PENDING status)
  const { sale } = await saleRepo.create({
    branchId,
    cashierId,
    subtotal: cartResult.subtotal,
    productDiscount: cartResult.totalProductDiscount,
    cartDiscount: cartResult.cartDiscount,
    totalDiscount: cartResult.totalDiscount,
    finalAmount: cartResult.finalAmount,
    discountsApplied: [], // can populate if needed
    status: "PENDING",
    paymentMode: "CARD"
  });

  const safe = this.safeNum;

  // 2️⃣ Create Sale Items
  const itemsToInsert = cartResult.lines.map((l: any) => ({
    saleId: sale._id!,
    productId: l.productId,
    unitPrice: safe(l.unitPrice),
    quantity: safe(l.quantity),
    appliedDiscountName: l.appliedDiscountName ?? null,
    appliedDiscountAmount: safe(l.appliedDiscountAmount),
    freeUnits: safe(l.freeUnits),
    total: safe(l.lineTotal)
  }));

  await saleItemRepo.createMany(itemsToInsert);

  // 3️⃣ Build Stripe line items
  const lineItems = cartResult.lines.map((l: any) => ({
    price_data: {
      currency: "inr",
      product_data: { name: l.productId },
      unit_amount: Math.round((l.lineTotal / l.quantity) * 100), // in paise
    },
    quantity: l.quantity
  }));

  // 4️⃣ Create Stripe Checkout Session with all metadata
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: {
      saleId: sale._id!.toString(),
      branchId,
      cashierId,
      cartResult: JSON.stringify(itemsToInsert) // stringify items
    }
  });

  return session;
}


}
