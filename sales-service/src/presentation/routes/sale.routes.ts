import { Router } from "express";
import { confirmSale, getAnalytics, getSaleById, getSales, getSalesDashBoard } from "../controllers/sale.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post("/payment", authorizeRoles('cashier'), confirmSale);
router.get("/sales-summary",authorizeRoles('admin', 'manager'), getSalesDashBoard);
router.get('/analytics',authorizeRoles( 'manager','admin'),getAnalytics)
router.get("/", authorizeRoles('cashier', 'admin', 'manager'), getSales);
router.get("/:salesId", authorizeRoles('admin', 'manager'), getSaleById);
export default router;
