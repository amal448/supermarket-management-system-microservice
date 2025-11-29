// IStockRequestRepository.ts
import { StockRequestDocument } from "../../infrastructure/database/models/stockRequest.model";

export interface IStockRequestRepository {
  createRequest(data: { branchId: string; requestedBy: string }): Promise<StockRequestDocument>;
  findById(id: string): Promise<StockRequestDocument | null>;
  findByBranchId(branchId: string,status?:string): Promise<StockRequestDocument[]>; // return multiple requests
}
