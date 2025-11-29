import { Request, Response } from "express";
import { CheckoutUseCase } from "../../application/use-cases/CreateSaleUseCase";

const useCase = new CheckoutUseCase();



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

