import { Request, Response } from "express";
import { CheckoutUseCase } from "../../application/use-cases/CreateSaleUseCase";
import { SalesService } from "../../application/services/sales.service";
import { SaleRepository } from "../../infrastructure/repositories/SaleRepository";
import { getSalesSummary } from "../../application/use-cases/GetSalesUseCase";

const useCase = new CheckoutUseCase();
const saleRepo = new SaleRepository();
const salesService = new SalesService(saleRepo);
const getSalesSummaryUseCase = new getSalesSummary(saleRepo);

export const confirmSale = async (req: Request, res: Response) => {
  try {
    const { cartResult, paymentMode } = req.body;

    const { branchId, id } = req.user!;
    
    //For Card
    if (paymentMode === 'CARD') {
      const session = await useCase.createStripeCheckoutSession({
        branchId,
        cashierId: id,
        cartResult
      })
      return res.json({ url: session.url });
    }

    const resu = await useCase.confirmSale({ branchId, cashierId: id, cartResult, paymentMode, token: req.headers.authorization?.split(" ")[1] });
    res.status(201).json(resu);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
export const getSales = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const search = String(req.query.search || "");

  try {
    const sales = await salesService.getSalesDataByAccount({
      ...req.user!,
      page,
      limit,
      search
    });

    if (!sales.data || sales.data.length === 0) {
      return res.status(404).json({ message: "No sales found" });
    }

   res.json(sales); 
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  console.log("getSaleById", req.body);

  try {
    const sale = await salesService.getSaleById(req.params.salesId);

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
// Controller
export const getSalesDashBoard = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const branchId = req.user?.branchId;
    console.log("getSalesDashBoard", role, branchId);

    let summary;

    if (role === "admin") {
      summary = await getSalesSummaryUseCase.execute();        // all branches
    } else if (role === "manager" || role === "cashier") {
      summary = await getSalesSummaryUseCase.execute(branchId); // only branch
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.json(summary); // <-- VERY IMPORTANT (Missing Earlier)

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to fetch sales dashboard" });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate, period } = req.query;

    if (!branchId || !startDate || !endDate || !period) {
      return res.status(400).json({ success: false, message: "Missing required query params" });
    }

    const analytics = await salesService.getAnalytics(
      branchId as string,
      new Date(startDate as string),
      new Date(endDate as string),
      period as "daily" | "monthly" | "yearly"
    );
    console.log("dataanalytics", analytics.data);

    return res.json({ success: true, data: analytics.data, total: analytics.total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


