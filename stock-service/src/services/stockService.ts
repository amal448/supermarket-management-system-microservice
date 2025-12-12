import { BranchInventory } from "../infrastructure/database/models/branchInventory.model";
import { sendStockUpdate } from "../kafka/producer";

export type StockItem = {
  productId: string;
  qty: number;
  freeUnits?: number;
};

export async function reduceStock(branchId: string, items: StockItem[]) {
  const updatedItems = [];

  for (const item of items) {
    const totalQty = item.qty + (item.freeUnits ?? 0);

    // Ensure stock does NOT go below zero
    const result = await BranchInventory.findOneAndUpdate(
      {
        branchId,
        productId: item.productId,
        stock: { $gte: totalQty }      // only reduce if enough stock
      },
      {
        $inc: { stock: -totalQty }
      },
      { new: true }
    );

    if (!result) {
      throw new Error(
        `Not enough stock for product ${item.productId}. Required: ${totalQty}.`
      );
    }

    updatedItems.push({
      productId: item.productId,
      stock: result.stock,
      requiredLevel: result.requiredLevel
    });
  }

  console.log("Stock updated for branch:", branchId);

  await sendStockUpdate(branchId, updatedItems);
}


