import { ISaleRepository } from "../../domain/repositories/ISaleRepository";
import { SaleEntity } from "../../domain/entities/Sale";
import { SaleModel } from "../mongoose-schemas/sale.schema";
import { toSaleEntity } from "../mappers/SaleMapper";
import { UserRole } from "../../application/services/sales.service";

export class SaleRepository implements ISaleRepository {

  async create(sale: SaleEntity): Promise<{ sale: SaleEntity }> {
    const createdSale = await SaleModel.create(sale);
    return { sale: toSaleEntity(createdSale.toObject()) };
  }

  async getSalesForRole(user: { id: string; role: UserRole; branchId: string }): Promise<SaleEntity[]> {
    let filter: any = {};

    if (user.role === "cashier") {
      filter = { cashierId: user.id };
    }
    else if (user.role === "manager") {
      filter = { branchId: user.branchId };
    }
    else if (user.role === "admin") {
      filter = {}; // all sales
    }

    console.log("Sales filter:", filter);

    const docs = await SaleModel.find(filter).lean();

    return docs.map(toSaleEntity);
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



}