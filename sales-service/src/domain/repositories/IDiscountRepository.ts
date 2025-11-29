// src/domain/repositories/IDiscountRepository.ts
import { DiscountEntity } from "../entities/DiscountEntity";

export interface IDiscountRepository {
    create(data: Partial<DiscountEntity>): Promise<DiscountEntity>;
    update(id: string, data: Partial<DiscountEntity>): Promise<DiscountEntity | null>;
    delete(id: string): Promise<void>;

    findById(id: string): Promise<DiscountEntity | null>;
    findAll(): Promise<DiscountEntity[]>;

    findApplicable(productId: string, category?: string): Promise<DiscountEntity[]>;

    findActiveProductDiscount(productId: string): Promise<DiscountEntity | null>;
    findActiveCartDiscount(): Promise<DiscountEntity | null>;
}
