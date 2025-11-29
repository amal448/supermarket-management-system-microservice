import mongoose, { Document, Schema } from "mongoose";

export interface StockRequestDocument extends Document {
  branchId: mongoose.Types.ObjectId;
  requestedBy: string;
  status: "PENDING" | "PARTIALLY_APPROVED" | "APPROVED" | "REJECTED";
}

const stockRequestSchema = new Schema(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    requestedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PARTIALLY_APPROVED", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const StockRequest =
  mongoose.model<StockRequestDocument>("StockRequest", stockRequestSchema);
