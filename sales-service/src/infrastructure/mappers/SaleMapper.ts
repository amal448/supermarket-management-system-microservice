import { SaleEntity } from "../../domain/entities/Sale";

export const toSaleEntity = (doc: any): SaleEntity => {
  if (!doc) return null as any;

  return {
    ...doc,
    _id: doc._id.toString(),   // 🔥 Fix ObjectId -> string
    branchId: doc.branchId.toString(),
    cashierId: doc.cashierId.toString(),
  };
};
