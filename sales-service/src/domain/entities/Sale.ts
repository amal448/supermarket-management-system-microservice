export interface SaleEntity {
  _id?: string;
  branchId: string;
  cashierId: string;
  subtotal: number;
  productDiscount: number;
  cartDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  discountsApplied: {
    productId: string;
    appliedDiscountType?: string;
    appliedDiscountName?: string;
    appliedDiscountAmount?: number;
    freeUnits?: number;
  }[];

  status: "PENDING" | "COMPLETED" | "REFUNDED";
  paymentMode?: "CASH" | "CARD" | "UPI";
  createdAt?: Date;
  updatedAt?: Date;
}
