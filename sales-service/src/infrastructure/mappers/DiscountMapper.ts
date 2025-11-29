import { DiscountEntity } from "../../domain/entities/DiscountEntity";

export class DiscountMapper {
  static toEntity(doc: any): DiscountEntity | null {
    if (!doc) return null;

    return {
      id: doc._id?.toString(),
      
      name: doc.name,
      type: doc.type,

      // product-level
      productId: doc.productId,
      // category: doc.category,
      // minQty: doc.minQty,

      // buy x get y
      buyQty: doc.buyQty,
      getQty: doc.getQty,

      // flat / percentage
      flatAmount: doc.flatAmount,
      percentage: doc.percentage,

      // cart-level
      minPurchaseAmount: doc.minPurchaseAmount,

      // meta
      isActive: doc.isActive,
      startDate: doc.startDate,
      endDate: doc.endDate,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toEntities(docs: any[]): DiscountEntity[] {
    return docs.map(d => DiscountMapper.toEntity(d)!).filter(Boolean) as DiscountEntity[];
  }
}
