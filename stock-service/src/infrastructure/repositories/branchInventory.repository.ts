// BranchInventoryRepository.ts
import { IBranchInventoryRepository } from "../../domain/repositories/branchInventory.repository";
import { BranchInventory } from "../database/models/branchInventory.model";
import { Types } from "mongoose";
export class BranchInventoryRepository implements IBranchInventoryRepository {
  async addStock(branchId: Types.ObjectId, productId: string, qty: number): Promise<void> {
    const inv = await BranchInventory.findOne({ branchId, productId });
    if (inv) {
      inv.stock += qty;
      await inv.save();
    } else {
      await BranchInventory.create({ branchId, productId, stock: qty });
    }
  }
}
