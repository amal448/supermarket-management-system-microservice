import { Request, Response } from "express";
import { DiscountRepository } from "../../infrastructure/repositories/DiscountRepository";
import { DiscountService } from "../../application/services/discount.service";
import { CheckoutUseCase } from "../../application/use-cases/CreateSaleUseCase";

const repo = new DiscountRepository();
const service = new DiscountService(repo);

export const createDiscount = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const created = await service.createDiscount(req.body);
    
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const updated = await service.updateDiscount(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    await repo.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDiscountById = async (req: Request, res: Response) => {
  try {
    const d = await repo.findById(req.params.id);
    res.json(d);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const listDiscounts = async (_req: Request, res: Response) => {
  try {
    const all = await repo.findAll();
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// POS apply: calculate cart (calls CheckoutUseCase.calculate)
const checkoutUseCase = new CheckoutUseCase();

export const applyDiscounts = async (req: Request, res: Response) => {
  try {
    console.log("applyDiscounts", req.body);

    const { items } = req.body;

    // FIX THE SHAPE HERE 👇
    const mappedItems = items.map((i: any) => ({
      productId: i._id,                              // FIXED
      category: i.category,                          // OK
      unitPrice: i.sellingPrice,                     // FIXED
      quantity: i.qty                                // FIXED
    }));

    console.log("Mapped Items →", mappedItems);

    const result = await checkoutUseCase.calculate(mappedItems);

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

