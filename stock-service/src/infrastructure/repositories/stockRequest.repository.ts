// StockRequestRepository.ts
import { IStockRequestRepository } from "../../domain/repositories/stockRequest.repository";
import { StockRequest, StockRequestDocument } from "../database/models/stockRequest.model";

export class StockRequestRepository implements IStockRequestRepository {
  async createRequest(data: { branchId: string; requestedBy: string }): Promise<StockRequestDocument> {
    return StockRequest.create(data);
  }

  async findById(id: string): Promise<StockRequestDocument | null> {
    return StockRequest.findById(id);
  }

  async findByBranchId(branchId: string, status?: string): Promise<StockRequestDocument[]> {

    const filter: any = { branchId };

    if (status) {
      filter.status = status;   // Filter by PENDING, APPROVED, etc.
    }

  return StockRequest.find(filter).sort({ createdAt: -1 });
  }
}
