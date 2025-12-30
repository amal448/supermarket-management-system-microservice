import { ISaleRepository } from "../../domain/repositories/ISaleRepository";
import { PaginatedSales, SaleEntity } from "../../domain/entities/Sale";
import { SaleModel } from "../mongoose-schemas/sale.schema";
import { toSaleEntity } from "../mappers/SaleMapper";
import { UserRole } from "../../application/services/sales.service";

export interface ProductSoldInfo {
  productId: string;
  name: string;
  quantity: number;
}

export interface SalesAnalyticsAggregate {
  _id: {
    year: number;
    month?: number;
    day?: number;
  };
  totalRevenue: number;
  totalDiscount: number;
  expectedProfit: number;
  actualProfit: number;
  productsSold: ProductSoldInfo[];
}

export interface SalesAnalyticsResult {
  data: SalesAnalyticsAggregate[];
  total: {
    totalRevenue: number;
    totalDiscount: number;
    expectedProfit: number;
    actualProfit: number;
  };
}
export class SaleRepository implements ISaleRepository {

  async create(sale: SaleEntity): Promise<{ sale: SaleEntity }> {
    const createdSale = await SaleModel.create(sale);
    return { sale: toSaleEntity(createdSale.toObject()) };
  }

async getSalesForRole(
  user: { id: string; role: UserRole; branchId: string },
  page = 1,
  limit = 5,
  search = ""
): Promise<PaginatedSales> {
  let filter: any = {};

  if (user.role === "cashier") {
    filter = { cashierId: user.id };
  } else if (user.role === "manager") {
    filter = { branchId: user.branchId };
  } else if (user.role === "admin") {
    filter = {}; // all sales
  }

  if (search) {
    filter.$or = [{ _id: search }, { "items.productId": search }];
  }

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    SaleModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SaleModel.countDocuments(filter)
  ]);

  const data = docs.map(toSaleEntity);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}


  async updateStatus(
    saleId: string,
    status: "PENDING" | "COMPLETED" | "REFUNDED"
  ): Promise<SaleEntity | null> {

    const doc = await SaleModel.findByIdAndUpdate(
      saleId,
      { status },
      { new: true }
    ).lean();

    return doc ? toSaleEntity(doc) : null;
  }
  async getSaleById(id: string): Promise<SaleEntity | null> {
    const doc = await SaleModel.findById(id).lean();
    return doc ? toSaleEntity(doc) : null;
  }
  async getSalesSummary(month?: number, year?: number) {
    const now = new Date();

    year = year ?? now.getFullYear();
    month = month ?? now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // ------------------------------
    // 1️⃣ DAILY DATA (amount + count)
    // ------------------------------
    const daily = await SaleModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            paymentMode: "$paymentMode",
          },
          totalAmount: { $sum: "$finalAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          payments: {
            $push: {
              paymentMode: "$_id.paymentMode",
              totalAmount: "$totalAmount",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyFormatted = daily.map((day) => {
      const result: any = {
        date: day._id,
        cash: 0,
        card: 0,
        count: day.totalCount
      };

      day.payments.forEach((p: any) => {
        if (p.paymentMode === "CASH") result.cash = p.totalAmount;
        if (p.paymentMode === "CARD") result.card = p.totalAmount;
      });

      return result;
    });

    // ------------------------------
    // 2️⃣ MONTHLY TOTAL + COUNT
    // ------------------------------
    const monthlyAgg = await SaleModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const monthlyTotal = monthlyAgg[0]?.totalAmount ?? 0;
    const monthlyCount = monthlyAgg[0]?.totalCount ?? 0;

    // ------------------------------
    // 3️⃣ YEARLY TOTAL + COUNT
    // ------------------------------
    const yearlyAgg = await SaleModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const yearlyTotal = yearlyAgg[0]?.totalAmount ?? 0;
    const yearlyCount = yearlyAgg[0]?.totalCount ?? 0;

    return {
      daily: dailyFormatted,
      monthlyTotal,
      monthlyCount,   // 👈 NEW
      yearlyTotal,
      yearlyCount     // 👈 NEW
    };
  }
  async getBranchSummary(branchId: string, month?: number, year?: number) {
    const now = new Date();

    year = year ?? now.getFullYear();
    month = month ?? now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // ------------------------------
    //  DAILY FILTERED BY BRANCH
    // ------------------------------
    const daily = await SaleModel.aggregate([
      {
        $match: {
          branchId,                                 // 👈 FILTER
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            paymentMode: "$paymentMode",
          },
          totalAmount: { $sum: "$finalAmount" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          payments: {
            $push: {
              paymentMode: "$_id.paymentMode",
              totalAmount: "$totalAmount",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyFormatted = daily.map((day) => {
      const result: any = {
        date: day._id,
        cash: 0,
        card: 0,
        count: day.totalCount,
      };

      day.payments.forEach((p: any) => {
        if (p.paymentMode === "CASH") result.cash = p.totalAmount;
        if (p.paymentMode === "CARD") result.card = p.totalAmount;
      });

      return result;
    });

    // ------------------------------
    //  MONTHLY FILTERED BY BRANCH
    // ------------------------------
    const monthlyAgg = await SaleModel.aggregate([
      {
        $match: {
          branchId,                                 // 👈 FILTER
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const monthlyTotal = monthlyAgg[0]?.totalAmount ?? 0;
    const monthlyCount = monthlyAgg[0]?.totalCount ?? 0;

    // ------------------------------
    //  YEARLY FILTERED BY BRANCH
    // ------------------------------
    const yearlyAgg = await SaleModel.aggregate([
      {
        $match: {
          branchId,                                 // 👈 FILTER
          createdAt: { $gte: startOfYear, $lte: endOfYear },
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$finalAmount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const yearlyTotal = yearlyAgg[0]?.totalAmount ?? 0;
    const yearlyCount = yearlyAgg[0]?.totalCount ?? 0;

    return {
      daily: dailyFormatted,
      monthlyTotal,
      monthlyCount,
      yearlyTotal,
      yearlyCount
    };
  }

  async getSalesAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date,
    period: "daily" | "monthly" | "yearly"
  ): Promise<SalesAnalyticsResult> {

    console.log("before aggregate", branchId, startDate, endDate, period);

    // Fix end-of-day
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    // Dynamic grouping
    const groupId: any = {};
    if (period === "daily") {
      groupId.year = { $year: "$createdAt" };
      groupId.month = { $month: "$createdAt" };
      groupId.day = { $dayOfMonth: "$createdAt" };
    } else if (period === "monthly") {
      groupId.year = { $year: "$createdAt" };
      groupId.month = { $month: "$createdAt" };
    } else if (period === "yearly") {
      groupId.year = { $year: "$createdAt" };
    }

    const result = await SaleModel.aggregate([
      {
        $match: {
          branchId,
          createdAt: { $gte: startDate, $lte: end },
          status: "COMPLETED"
        }
      },

      // --- FIX: Keep sales even if saleitems is empty ---
      {
        $lookup: {
          from: "saleitems",
          localField: "_id",
          foreignField: "saleId",
          as: "items"
        }
      },
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: true
        }
      },

      // --- FIX: Even if productCache missing ---
      {
        $lookup: {
          from: "productcaches",
          localField: "items.productId",
          foreignField: "productId",
          as: "productCache"
        }
      },
      {
        $unwind: {
          path: "$productCache",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $group: {
          _id: groupId,

          totalRevenue: {
            $sum: {
              $cond: [
                "$items",
                { $multiply: ["$items.unitPrice", "$items.quantity"] },
                0
              ]
            }
          },

          totalDiscount: {
            $sum: {
              $cond: [
                "$items",
                { $add: ["$items.appliedDiscountAmount", { $ifNull: ["$cartDiscount", 0] }] },
                0
              ]
            }
          },

          expectedProfit: {
            $sum: {
              $cond: [
                "$productCache",
                {
                  $multiply: [
                    { $subtract: ["$productCache.sellingPrice", "$productCache.costPrice"] },
                    "$items.quantity"
                  ]
                },
                0
              ]
            }
          },

          actualProfit: {
            $sum: {
              $cond: [
                "$productCache",
                {
                  $subtract: [
                    {
                      $subtract: [
                        { $multiply: ["$items.unitPrice", "$items.quantity"] },
                        "$items.appliedDiscountAmount"
                      ]
                    },
                    { $multiply: ["$productCache.costPrice", "$items.quantity"] }
                  ]
                },
                0
              ]
            }
          },

          productsSold: {
            $push: {
              productId: "$items.productId",
              quantity: "$items.quantity",
              name: "$productCache.name"
            }
          }
        }
      },

      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Compute totals
    const total = result.reduce(
      (acc, item) => {
        acc.totalRevenue += item.totalRevenue;
        acc.totalDiscount += item.totalDiscount;
        acc.expectedProfit += item.expectedProfit;
        acc.actualProfit += item.actualProfit;
        return acc;
      },
      { totalRevenue: 0, totalDiscount: 0, expectedProfit: 0, actualProfit: 0 }
    );

    // NEW FIELDS
    const totalAmountInHand = total.totalRevenue - total.totalDiscount;
    const shortage = total.expectedProfit - total.actualProfit;

    return {
      data: result,
      total: {
        ...total,
        totalAmountInHand,
        shortage
      }
    }
  }
}