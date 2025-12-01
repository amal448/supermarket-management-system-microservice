import { SaleItemEntity } from "../../domain/entities/SaleItem";
import { SaleItemModel } from "../mongoose-schemas/saleItem.schema";

export class SaleItemRepository {
  async createMany(items: Partial<SaleItemEntity>[]) {
    console.log("createMany",items);
    
    const docs = await SaleItemModel.insertMany(items);
    return docs.map(d => d.toObject());
  }

  async findBySaleId(saleId: string) {
    return SaleItemModel.find({ saleId }).lean();
  }
}
