import { Router } from "express";
import {  confirmSale } from "../controllers/sale.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post("/payment",authorizeRoles('cashier'), confirmSale);

export default router;
