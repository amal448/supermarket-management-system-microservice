import mongoose, { Schema, Document } from "mongoose";

export interface SaleItemDoc extends Document {
  saleId: object;
  productId: string;
  unitPrice: number;
  quantity: number;
  appliedDiscountName?: string;
  appliedDiscountAmount: number;
  freeUnits: number;
  total: number;
}

const schema = new Schema<SaleItemDoc>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
    productId: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    appliedDiscountName: { type: String },
    appliedDiscountAmount: { type: Number, default: 0 },
    freeUnits: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

export const SaleItemModel = mongoose.model<SaleItemDoc>("SaleItem", schema);
