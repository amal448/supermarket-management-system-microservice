import { ISaleRepository } from "../../domain/repositories/ISaleRepository";

export class getSalesSummary {
  constructor(private saleRepo: ISaleRepository) {}

  async execute(branchId?: string) {
    if (branchId) {
      return await this.saleRepo.getBranchSummary(branchId);
    }
    return await this.saleRepo.getSalesSummary();
  }
}
