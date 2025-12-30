// src/infrastructure/repositories/product.repository.ts
import { PaginatedResponse, ProductEntity } from "../../domain/entities/product.entity";
import { ProductModel } from "../../infrastructure/database/models/product.model";
import { sendProductInfoUpdate } from "../../kafka/productProducer/productProducer";

export class ProductRepository {

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await ProductModel.findById(id).lean();
    if (!product) return null;

    return this.mapDocToEntity(product);
  }

  async findAll(page: number, limit: number, search: string):Promise<PaginatedResponse<ProductEntity>> {
    const skip = (page - 1) * limit;

    const filter = search
      ? { name: { $regex: search, $options: "i" } }
      : {};
    const [items, total] = await Promise.all([
      ProductModel.find(filter).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      items: items.map(p => this.mapDocToEntity(p)),
      total,
      page,
      limit,
    };
  }
  async findOne(name: string, unit: string, brand: string): Promise<ProductEntity | null> {
    const product = await ProductModel.findOne({ name, unit, brand }).lean();
    return product ? this.mapDocToEntity(product) : null;
  }


  async create(data: ProductEntity): Promise<ProductEntity> {
    const product = new ProductModel(data);
    await product.save();
    await sendProductInfoUpdate(product);
    return this.mapDocToEntity(product.toObject());
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null> {
    const updated = await ProductModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) return null;
    return this.mapDocToEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async findBySKU(sku: string): Promise<ProductEntity | null> {
    const product = await ProductModel.findOne({ sku }).lean();
    return product ? this.mapDocToEntity(product) : null;
  }

  // Helper to map Mongoose document to ProductEntity
  private mapDocToEntity(doc: any): ProductEntity {
    return {
      _id: doc._id?.toString(),
      name: doc.name,
      sku: doc.sku,
      unit: doc.unit,
      category: doc.category,
      brand: doc.brand,
      costPrice: doc.costPrice,
      sellingPrice: doc.sellingPrice,
      createdBy: doc.createdBy,
    };
  }
}
