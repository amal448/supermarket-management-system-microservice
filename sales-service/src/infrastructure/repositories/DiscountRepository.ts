// src/infrastructure/repositories/DiscountRepository.ts
import { IDiscountRepository } from "../../domain/repositories/IDiscountRepository";
import { DiscountEntity } from "../../domain/entities/DiscountEntity";
import { DiscountModel } from "../mongoose-schemas/discount.schema";
import { DiscountMapper } from "../mappers/DiscountMapper";

export class DiscountRepository implements IDiscountRepository {

    async create(data: Partial<DiscountEntity>): Promise<DiscountEntity> {
        const doc = await DiscountModel.create(data);
        return DiscountMapper.toEntity(doc)!; 
    }

    async update(id: string, data: Partial<DiscountEntity>): Promise<DiscountEntity | null> {
        const doc = await DiscountModel.findByIdAndUpdate(id, data, { new: true });
        return DiscountMapper.toEntity(doc);
    }

    async delete(id: string): Promise<void> {
        await DiscountModel.findByIdAndDelete(id);
    }

    async findById(id: string): Promise<DiscountEntity | null> {
        const doc = await DiscountModel.findById(id).lean();
        return DiscountMapper.toEntity(doc);
    }

    async findAll(): Promise<DiscountEntity[]> {
        const docs = await DiscountModel.find().lean();
        return DiscountMapper.toEntities(docs);
    }

    async findApplicable(productId: string, category?: string): Promise<DiscountEntity[]> {
      console.log("productId",productId);
      
        const now = new Date();
        
        const docs = await DiscountModel.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            productId: productId
        }).lean();
        console.log("DiscountModel",docs);
        
        return DiscountMapper.toEntities(docs);
    }

    async findActiveProductDiscount(productId: string): Promise<DiscountEntity | null> {
        const now = new Date();
        const doc = await DiscountModel.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            productId,
            type: { $in: ["PRODUCT_PERCENTAGE", "PRODUCT_FLAT", "BUY_X_GET_Y"] }
        }).lean();

        return DiscountMapper.toEntity(doc);
    }

    async findActiveCartDiscount(): Promise<DiscountEntity | null> {
        const now = new Date();
        const doc = await DiscountModel.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            type: { $in: ["CART_PERCENTAGE", "CART_FLAT"] }
        }).lean();

        return DiscountMapper.toEntity(doc);
    }
}
