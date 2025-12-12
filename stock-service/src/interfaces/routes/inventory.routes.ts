import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.get("/", InventoryController.getProducts);
router.get("/:id", InventoryController.getProductById);
router.post("/add-product", authorizeRoles( "admin"), InventoryController.addProduct);
router.put("/:id", authorizeRoles("admin", "manager"), InventoryController.updateProduct);
router.delete("/:id", authorizeRoles("admin"), InventoryController.deleteProduct);
router.get("/branch/stock",authorizeRoles("manager","cashier"), InventoryController.getBranchInventory);
router.post("/check/branch-stock", InventoryController.checkBranchInventoryStock);

export default router;
