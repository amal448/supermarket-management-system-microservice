export interface ProductSoldInfo {
  productId: string;
  name: string;
  quantity: number;
}

export interface SalesAnalyticsItem {
  _id: { year: number; month?: number; day?: number };
  totalRevenue: number;
  totalDiscount: number;
  expectedProfit: number;
  actualProfit: number;
  productsSold: ProductSoldInfo[];
  profitVariation?: number;
  mostSoldProduct?: ProductSoldInfo | null;
  leastSoldProduct?: ProductSoldInfo | null;
}

export interface SalesAnalyticsResult {
  data: SalesAnalyticsItem[];
  total: {
    totalRevenue: number;
    totalDiscount: number;
    expectedProfit: number;
    actualProfit: number;
  };
}
