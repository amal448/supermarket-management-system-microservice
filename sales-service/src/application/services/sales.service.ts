import { ISaleRepository } from "../../domain/repositories/ISaleRepository";
import { ProductSoldInfo, SalesAnalyticsItem, SalesAnalyticsResult } from "../../types/analytics.types";

export type UserRole = "cashier" | "manager" | "admin";

export class SalesService {
  constructor(private repo: ISaleRepository) { }

async getSalesDataByAccount(user: { id: string; role: UserRole; branchId: string, page: number, limit: number, search: string }) {
  return this.repo.getSalesForRole(user, user.page, user.limit, user.search);
}

  async getSaleById(id: string) {
    return this.repo.getSaleById(id);
  }
  async getAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date,
    period: "daily" | "monthly" | "yearly"
  ): Promise<SalesAnalyticsResult> {
    const rawResult = await this.repo.getSalesAnalytics(branchId, startDate, endDate, period);
    const rawData = rawResult.data;

    const dailyData: SalesAnalyticsItem[] = rawData.map((item: SalesAnalyticsItem) => {
      const products = item.productsSold;

      const mostSold: ProductSoldInfo | null =
        products.length > 0 ? products.reduce((a: ProductSoldInfo, b: ProductSoldInfo) => (b.quantity > a.quantity ? b : a), products[0]) : null;

      const leastSold: ProductSoldInfo | null =
        products.length > 0 ? products.reduce((a: ProductSoldInfo, b: ProductSoldInfo) => (b.quantity < a.quantity ? b : a), products[0]) : null;

      return {
        ...item,
        profitVariation: item.expectedProfit - item.actualProfit,
        mostSoldProduct: mostSold,
        leastSoldProduct: leastSold,
      };
    });

    return { data: dailyData, total: rawResult.total };
  }



}
