import mongoose, { Schema, Document } from "mongoose";

export interface DiscountDoc extends Document {
  name: string;
  type: string;
  productId?: string;
  // minQty?: number;
  buyQty?: number;
  getQty?: number;
  flatAmount?: number;
  percentage?: number;
  minPurchaseAmount?: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdBy?: string;
}

const schema = new Schema<DiscountDoc>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    productId: { type: String },
    // minQty: { type: Number },
    buyQty: { type: Number },
    getQty: { type: Number },
    flatAmount: { type: Number },
    percentage: { type: Number },
    minPurchaseAmount: { type: Number },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const DiscountModel = mongoose.model<DiscountDoc>("Discount", schema);
