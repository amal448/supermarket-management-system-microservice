import { ISaleRepository } from "../../domain/repositories/ISaleRepository";
import { SaleEntity } from "../../domain/entities/Sale";
import { SaleModel } from "../mongoose-schemas/sale.schema";
import { toSaleEntity } from "../mappers/SaleMapper";
import { UserRole } from "../../application/services/sales.service";

export class SaleRepository implements ISaleRepository {

  async create(sale: SaleEntity): Promise<{ sale: SaleEntity }> {
    const createdSale = await SaleModel.create(sale);
    return { sale: toSaleEntity(createdSale.toObject()) };
  }

  async getSalesForRole(user: { id: string; role: UserRole; branchId: string }): Promise<SaleEntity[]> {
    let filter: any = {};

    if (user.role === "cashier") {
      filter = { cashierId: user.id };
    }
    else if (user.role === "manager") {
      filter = { branchId: user.branchId };
    }
    else if (user.role === "admin") {
      filter = {}; // all sales
    }

    console.log("Sales filter:", filter);

    const docs = await SaleModel.find(filter).lean();

    return docs.map(toSaleEntity);
  }

  async updateStatus(
    saleId: string,
    status: "PENDING" | "COMPLETED" | "REFUNDED"
  ): Promise<SaleEntity | null> {

    const doc = await SaleModel.findByIdAndUpdate(
      saleId,
      { status },
      { new: true }
    ).lean();

    return doc ? toSaleEntity(doc) : null;
  }
  async getSaleById(id: string): Promise<SaleEntity | null> {
  const doc = await SaleModel.findById(id).lean();
  return doc ? toSaleEntity(doc) : null;
}

}
