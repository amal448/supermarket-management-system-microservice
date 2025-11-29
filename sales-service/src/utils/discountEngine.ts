// src/utils/discountEngine.ts
// Rupee-based version (no paise anywhere)

export type ProductDiscountType = "BUY_X_GET_Y" | "FLAT" | "PRODUCT_PERCENTAGE";
export type CartDiscountType = "CART_FLAT" | "CART_PERCENTAGE";

export type ProductDiscount = {
  _id?: string;
  name?: string;
  type: ProductDiscountType;
  productId?: string;

  // BUY_X_GET_Y
  buyQty?: number;
  getQty?: number;

  // FLAT and PERCENTAGE
  flatAmount?: number;    // flat rupee amount per unit
  percentage?: number;

  isActive?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
};

export type CartDiscount = {
  _id?: string;
  name?: string;
  type: CartDiscountType;
  minPurchaseAmount: number;     // in rupees
  flatAmount?: number;
  percentage?: number;
  isActive?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
};

type CartItemInput = {
  productId: string;
  category?: string;
  unitPrice: number; // rupees
  quantity: number;
};

export type LineBreakdown = {
  productId: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;

  appliedDiscountType?: ProductDiscountType | null;
  appliedDiscountName?: string | null;
  appliedDiscountAmount: number;
  freeUnits: number;

  lineTotal: number;
  evaluatedDiscounts: {
    discountId?: string;
    name?: string;
    type: ProductDiscountType;
    amount: number;
    freeUnits: number;
    reason?: string;
  }[];
};

/* ---------------- DISCOUNT CALCULATIONS ---------------- */

function evalBuyXGetY(price: number, qty: number, d: ProductDiscount) {
  const buy = d.buyQty ?? 0;
  const get = d.getQty ?? 0;
  if (buy <= 0 || get <= 0) return { amount: 0, freeUnits: 0 };

  const group = buy + get;
  const sets = Math.floor(qty / group);
  const freeUnits = sets * get;
  const amount = Number((freeUnits * price).toFixed(2));

  return { amount, freeUnits, reason: `BUY ${buy} GET ${get}` };
}

function evalFlat(price: number, qty: number, d: ProductDiscount) {
  if (!d.flatAmount || d.flatAmount <= 0) return { amount: 0, freeUnits: 0 };

  const amount = Number((d.flatAmount * qty).toFixed(2));
  return { amount, freeUnits: 0, reason: `FLAT ${d.flatAmount}` };
}

function evalPercentage(price: number, qty: number, d: ProductDiscount) {
  if (!d.percentage || d.percentage <= 0) return { amount: 0, freeUnits: 0 };

  const subtotal = price * qty;
  const amount = Number(((subtotal * d.percentage) / 100).toFixed(2));

  return { amount, freeUnits: 0, reason: `PERCENT ${d.percentage}%` };
}

/* ---------------- APPLY PRODUCT DISCOUNT PER LINE ---------------- */

function applyProductDiscountForLine(
  item: CartItemInput,
  productDiscounts: ProductDiscount[] | undefined
): LineBreakdown {
  const { productId, unitPrice, quantity } = item;
  const lineSubtotal = Number((unitPrice * quantity).toFixed(2));

  const evaluated: any[] = [];

  if (productDiscounts?.length) {
    for (const d of productDiscounts) {
      if (d.isActive === false) continue;
      if (d.startDate && new Date(d.startDate) > new Date()) continue;
      if (d.endDate && new Date(d.endDate) < new Date()) continue;

      let result;
      if (d.type === "BUY_X_GET_Y") {
        result = evalBuyXGetY(unitPrice, quantity, d);
      } else if (d.type === "FLAT") {
        result = evalFlat(unitPrice, quantity, d);
      } else if (d.type === "PRODUCT_PERCENTAGE") {
        result = evalPercentage(unitPrice, quantity, d);
      }

      if (result) {
        evaluated.push({
          discountId: d._id,
          name: d.name,
          type: d.type,
          amount: result.amount,
          freeUnits: result.freeUnits,
          reason: result.reason,
        });
      }
    }
  }

  // priority → BUY_X_GET_Y > FLAT > PERCENT
  const buy = evaluated.filter(e => e.type === "BUY_X_GET_Y" && e.amount > 0);
  const flat = evaluated.filter(e => e.type === "FLAT" && e.amount > 0);
  const pct = evaluated.filter(e => e.type === "PRODUCT_PERCENTAGE" && e.amount > 0);

  let chosen: any = null;

  if (buy.length) {
    buy.sort((a, b) => b.amount - a.amount);
    chosen = buy[0];
  } else if (flat.length) {
    flat.sort((a, b) => b.amount - a.amount);
    chosen = flat[0];
  } else if (pct.length) {
    pct.sort((a, b) => b.amount - a.amount);
    chosen = pct[0];
  }

  const appliedDiscountAmount = chosen ? chosen.amount : 0;
  const freeUnits = chosen ? chosen.freeUnits : 0;

  return {
    productId,
    unitPrice,
    quantity,
    lineSubtotal,
    appliedDiscountType: chosen?.type ?? null,
    appliedDiscountName: chosen?.name ?? null,
    appliedDiscountAmount,
    freeUnits,
    lineTotal: Number((lineSubtotal - appliedDiscountAmount).toFixed(2)),
    evaluatedDiscounts: evaluated,
  };
}

/* ---------------- MAIN CART CALCULATION ---------------- */

export async function calculateCart(
  items: CartItemInput[],
  getApplicableDiscounts: (productId: string, category?: string) => Promise<ProductDiscount[]>,
  getActiveCartDiscount: () => Promise<CartDiscount | null>
) {
  const lines: LineBreakdown[] = [];

  let subtotal = 0;
  let totalProductDiscount = 0;

  for (const it of items) {
    const discounts = await getApplicableDiscounts(it.productId, it.category);
    const line = applyProductDiscountForLine(it, discounts);

    lines.push(line);
    subtotal += line.lineSubtotal;
    totalProductDiscount += line.appliedDiscountAmount;
  }

  subtotal = Number(subtotal.toFixed(2));
  totalProductDiscount = Number(totalProductDiscount.toFixed(2));

  const cartDisc = await getActiveCartDiscount();
  const afterProduct = subtotal - totalProductDiscount;

  let cartDiscount = 0;

  if (cartDisc) {
    const eligible = 
      cartDisc.isActive !== false &&
      (!cartDisc.startDate || new Date(cartDisc.startDate) <= new Date()) &&
      (!cartDisc.endDate || new Date(cartDisc.endDate) >= new Date()) &&
      afterProduct >= cartDisc.minPurchaseAmount;

    if (eligible) {
      if (cartDisc.type === "CART_FLAT" && cartDisc.flatAmount) {
        cartDiscount = cartDisc.flatAmount;
      } else if (cartDisc.type === "CART_PERCENTAGE" && cartDisc.percentage) {
        cartDiscount = Number(((afterProduct * cartDisc.percentage) / 100).toFixed(2));
      }
    }
  }

  const totalDiscount = Number((totalProductDiscount + cartDiscount).toFixed(2));
  const finalAmount = Number((subtotal - totalDiscount).toFixed(2));

  return {
    lines,
    subtotal,
    totalProductDiscount,
    cartDiscount,
    totalDiscount,
    finalAmount,
  };
}
