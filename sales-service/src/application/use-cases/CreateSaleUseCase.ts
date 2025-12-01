import { DiscountRepository } from "../../infrastructure/repositories/DiscountRepository";
import { calculateCart } from "../../utils/discountEngine";
import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";
import { SaleItemRepository } from "../../infrastructure/repositories/SaleItemRepository";
import Stripe from "stripe";

const discountRepo = new DiscountRepository();
const saleRepo = new SaleRepository();
const saleItemRepo = new SaleItemRepository();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
  }) {
    const { branchId, cashierId, cartResult, paymentMode } = payload;
    console.log("cartResult.lines", cartResult);

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
    console.log("before  await saleItemRepo.createMany(itemsToInsert);");

    await saleItemRepo.createMany(itemsToInsert);

    return { sale, items: itemsToInsert };
  }

  async createStripeCheckoutSession(payload: { branchId: string; cashierId: string; cartResult: any }) {
    const { branchId, cashierId, cartResult } = payload;
    console.log("createStripeCheckoutSession", cartResult);

    const { sale } = await saleRepo.create({
      branchId,
      cashierId,
      subtotal: cartResult.subtotal,
      productDiscount: cartResult.totalProductDiscount,
      cartDiscount: cartResult.cartDiscount,
      totalDiscount: cartResult.totalDiscount,
      finalAmount: cartResult.finalAmount,
      discountsApplied: [],
      status: "PENDING",         // IMPORTANT ❗
      paymentMode: "CARD"
    });

    const safe = this.safeNum;
    // 🟦 Create Sale Items
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
    // 2️⃣ Build Stripe line items
    // 2️⃣ Build Stripe line items
    const lineItems = cartResult.lines.map((l: any) => {
      // Stripe expects per-unit amount in paise
      const discountedUnitPrice = Math.round((l.lineTotal / l.quantity) * 100); // convert to paise

      return {
        price_data: {
          currency: "inr",
          product_data: { name: l.productId },
          unit_amount: discountedUnitPrice,
        },
        quantity: l.quantity
      };
    });


    // 3️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        saleId: sale._id!.toString()
      }
    })
    return session;
  }


}
