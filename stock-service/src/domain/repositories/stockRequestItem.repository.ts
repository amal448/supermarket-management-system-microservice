// IStockRequestItemRepository.ts
import { StockRequestItemDocument } from "../../infrastructure/database/models/stockRequestItem.model";

export interface IStockRequestItemRepository {
  createManyItems(items: {
    requestId: string;
    productId: string;
    requestedQty: number;
  }[]): Promise<StockRequestItemDocument[]>;

  findByRequestId(requestId: string): Promise<StockRequestItemDocument[]>;

  findById(id: string): Promise<StockRequestItemDocument | null>;
}
