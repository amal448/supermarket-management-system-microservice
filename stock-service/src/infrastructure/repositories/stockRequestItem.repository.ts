// StockRequestItemRepository.ts
import mongoose from "mongoose";
import { IStockRequestItemRepository } from "../../domain/repositories/stockRequestItem.repository";
import { StockRequestItem, StockRequestItemDocument } from "../database/models/stockRequestItem.model";

export class StockRequestItemRepository implements IStockRequestItemRepository {
  
  async createManyItems(items: { requestId: string; productId: string; requestedQty: number }[]): Promise<StockRequestItemDocument[]> {
   const converted = items.map(i => ({
      requestId: new mongoose.Types.ObjectId(i.requestId),
      productId: new mongoose.Types.ObjectId(i.productId),
      requestedQty: i.requestedQty,
      approvedQty: 0,
      status: "PENDING"
    }));
     return StockRequestItem.insertMany(converted);
  }

  async findByRequestId(requestId: string): Promise<StockRequestItemDocument[]> {
    return StockRequestItem.find({ requestId });
  }

  async findById(id: string): Promise<StockRequestItemDocument | null> {
    return StockRequestItem.findById(id);
  }
}
