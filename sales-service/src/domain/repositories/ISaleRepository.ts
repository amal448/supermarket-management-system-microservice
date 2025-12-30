import { SalesAnalyticsAggregate } from "../../infrastructure/repositories/SaleRepository";
import { PaginatedSales, SaleEntity } from "../entities/Sale";

export interface SalesAnalyticsResult {
  data: SalesAnalyticsAggregate[];
  total: {
    totalRevenue: number;
    totalDiscount: number;
    expectedProfit: number;
    actualProfit: number;
  };
}
export interface ISaleRepository {
  create(
    sale: SaleEntity,
  ): Promise<{ sale: SaleEntity }>;

  getSalesForRole(
    user: { id: string; role: "cashier" | "manager" | "admin"; branchId: string },
    page?: number,
    limit?: number,
    search?: string
  ): Promise<PaginatedSales>;
  getSaleById(id: string): Promise<SaleEntity | null>;
  // getAll(branchId?: string): Promise<SaleEntity[]>;

  updateStatus(
    saleId: string,
    status: "PENDING" | "COMPLETED" | "REFUNDED"
  ): Promise<SaleEntity | null>;

  getSalesSummary(month?: number, year?: number): Promise<{
    daily: any[];
    monthlyTotal: number;
    yearlyTotal: number;
  }>;
  getBranchSummary(branchId?: string, month?: number, year?: number): Promise<{
    daily: any[];
    monthlyTotal: number;
    yearlyTotal: number;
  }>;

  getSalesAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date,
    period: "daily" | "monthly" | "yearly"
  ): Promise<SalesAnalyticsResult>;

}
