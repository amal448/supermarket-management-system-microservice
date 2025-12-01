import { Router } from "express";
import {  confirmSale, getSaleById, getSales } from "../controllers/sale.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post("/payment",authorizeRoles('cashier'), confirmSale);
router.get("/",authorizeRoles('cashier','admin','manager'), getSales);
router.get("/:salesId",authorizeRoles('admin','manager'), getSaleById );

export default router;
