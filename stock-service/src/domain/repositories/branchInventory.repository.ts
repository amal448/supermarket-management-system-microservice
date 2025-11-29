import { Types } from "mongoose";

// IBranchInventoryRepository.ts
export interface IBranchInventoryRepository {
  addStock(branchId: Types.ObjectId, productId: string, qty: number): Promise<void>;
}
