import mongoose, { Document, Schema } from "mongoose";

// Interface for a single branch inventory document
export interface BranchInventoryDocument extends Document {
  branchId: Object;
  productId:Object;
  stock: number;
  requiredLevel:number
  status:string
}

const branchInventorySchema = new Schema<BranchInventoryDocument>({
  branchId:{ type: Schema.Types.ObjectId, ref: "Branch", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  
  stock: { type: Number, default: 0 },
  requiredLevel: { type: Number, default: 10 },
});

export const BranchInventory = mongoose.model<BranchInventoryDocument>("BranchInventory", branchInventorySchema);
