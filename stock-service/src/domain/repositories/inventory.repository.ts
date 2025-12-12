import { BranchInventoryDocument } from "../../infrastructure/database/models/branchInventory.model";

export interface IInventoryRepository {
  findByProduct(branchId: string, productId: string): Promise<BranchInventoryDocument
 | null>;
}
