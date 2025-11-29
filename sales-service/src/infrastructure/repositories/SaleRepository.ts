import { SaleEntity } from "../../domain/entities/Sale";
import { SaleModel } from "../mongoose-schemas/sale.schema";


export class SaleRepository {
  async create(s: Partial<SaleEntity>) {
    const doc = await SaleModel.create(s);
    return doc.toObject();
  }

  async findById(id: string) {
    const doc = await SaleModel.findById(id).lean();
    return doc;
  }

  async updateStatus(id: string, status: "PENDING" | "COMPLETED" | "REFUNDED") {
    return SaleModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }

  async listByBranch(branchId: string) {
    return SaleModel.find({ branchId }).lean();
  }
}
