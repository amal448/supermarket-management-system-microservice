// src/domain/repositories/ISaleRepository.ts

import { SaleEntity } from "../entities/Sale";
import { SaleItemEntity } from "../entities/SaleItem";

export interface ISaleRepository {
    create(
        sale: SaleEntity,
        items: SaleItemEntity[]
    ): Promise<{ sale: SaleEntity; items: SaleItemEntity[] }>;

    getById(id: string): Promise<SaleEntity | null>;

    getAll(branchId?: string): Promise<SaleEntity[]>;
    updateStatus(saleId?: string): Promise<SaleEntity[]>;


}
