import { SaleEntity } from "../entities/Sale";

export interface ISaleRepository {
  create(
    sale: SaleEntity,
  ): Promise<{ sale: SaleEntity }>;

  getSalesForRole(user: {
    id: string;
    role: "cashier" | "manager" | "admin";
    branchId: string;
  }): Promise<SaleEntity[]>;

  getSaleById(id: string): Promise<SaleEntity | null>;
  // getAll(branchId?: string): Promise<SaleEntity[]>;

  updateStatus(
    saleId: string,
    status: "PENDING" | "COMPLETED" | "REFUNDED"
  ): Promise<SaleEntity | null>;
}
