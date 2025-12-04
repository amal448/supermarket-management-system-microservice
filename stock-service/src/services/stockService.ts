import { BranchInventory } from "../infrastructure/database/models/branchInventory.model";
import { sendStockUpdate } from "../kafka/producer";

export type StockItem = {
  productId: string;
  qty: number;
  freeUnits?: number;
};

export async function reduceStock(branchId: string, items: StockItem[]) {
  const updatedItems=[]
  for (const item of items) {
    const totalQty = item.qty + (item.freeUnits ?? 0);

    // Reduce stock atomically
    const result  = await BranchInventory.findOneAndUpdate(
      { branchId, productId: item.productId },
      { $inc: { stock: -totalQty } },
      { new: true }
    );

    if(result){
      updatedItems.push({
        productId:item.productId,
        stock:result.stock,
        requiredLevel:result.requiredLevel
      })
    }
  }
  console.log("Stock updated for branch:", branchId);
  //call producer for sending this update to user
   await sendStockUpdate(branchId, updatedItems);
}


