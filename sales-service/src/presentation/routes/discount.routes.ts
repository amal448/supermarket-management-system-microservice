import { Router } from "express";
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountById,
  listDiscounts,
  applyDiscounts
} from "../controllers/discount.controller";

const router = Router();

// Admin
router.post("/", createDiscount);
router.put("/:id", updateDiscount);
router.delete("/:id", deleteDiscount);
router.get("/:id", getDiscountById);
router.get("/", listDiscounts);

// Cashier / POS
router.post("/apply", applyDiscounts); // accepts { items: [{ productId, unitPrice, quantity, category? }] }

export default router;
