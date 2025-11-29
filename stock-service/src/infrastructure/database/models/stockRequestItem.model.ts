import mongoose, { Document, Schema } from "mongoose";

export interface StockRequestItemDocument extends Document {
  requestId:  mongoose.Types.ObjectId;
  productId:  mongoose.Types.ObjectId;
  requestedQty: number;
  approvedQty: number;
  status:string;
}

const stockRequestItemSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "StockRequest", required: true },
    productId:{ type: Schema.Types.ObjectId, ref: "Product", required: true },
    requestedQty: { type: Number, required: true },
    approvedQty: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const StockRequestItem =
  mongoose.model<StockRequestItemDocument>("StockRequestItem", stockRequestItemSchema);
