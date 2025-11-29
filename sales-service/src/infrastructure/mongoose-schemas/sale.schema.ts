import mongoose, { Schema, Document } from "mongoose";

export interface SaleDoc extends Document {
  branchId: string;
  cashierId: string;
  subtotal: number;
  productDiscount: number;
  cartDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  status: string;
  paymentMode?: string;
   discountsApplied: {
    productId:string;
    appliedDiscountType: string | null;
    appliedDiscountName: string | null;
    appliedDiscountAmount: number;
    freeUnits: number;
  }[];
}

const saleSchema = new Schema<SaleDoc>(
  {
    branchId: { type: String, required: true },
    cashierId: { type: String, required: true },
    subtotal: { type: Number, required: true },
    productDiscount: { type: Number, required: true },
    cartDiscount: { type: Number, required: true },
    totalDiscount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "REFUNDED"], default: "PENDING" },
    paymentMode: { type: String },
    discountsApplied: [
  {
    appliedDiscountType: { type: String, default: null },
    appliedDiscountName: { type: String, default: null },
    appliedDiscountAmount: { type: Number, default: 0 },
    freeUnits: { type: Number, default: 0 },
    productId: { type: String, default: 0 }
  }
]

  },
  { timestamps: true }
);

export const SaleModel = mongoose.model<SaleDoc>("Sale", saleSchema);
