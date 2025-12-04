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

    const resu = await useCase.confirmSale({ branchId, cashierId: id, cartResult, paymentMode });
    res.status(201).json(resu);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
export const getSales = async (req: Request, res: Response) => {
  try {
    // const  {id}= req.user;
    console.log("requser", req.user);
    const sale = await salesService.getSalesDataByAccount(req.user!);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const getSaleById = async (req: Request, res: Response) => {
  try {
    const sale = await salesService.getSaleById(req.params.salesId);

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    res.json(sale);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const getSalesAnalysis = async (req: Request, res: Response) => {
  try {
    console.log("getSalesAnalysisgetSalesAnalysisgetSalesAnalysis",req.body);
    
      const result = await getSalesSummaryUseCase.execute();
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Unable to fetch daily sales" });
    }
}


