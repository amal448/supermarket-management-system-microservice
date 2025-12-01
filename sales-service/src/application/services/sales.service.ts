import { ISaleRepository } from "../../domain/repositories/ISaleRepository";
export type UserRole = "cashier" | "manager" | "admin";

export class SalesService {
  constructor(private repo: ISaleRepository) { }

  async getSalesDataByAccount(user: { id: string; role: UserRole; branchId: string }) {
    return this.repo.getSalesForRole(user);
  }
  async getSaleById(id: string) {
    return this.repo.getSaleById(id);
  }


}
