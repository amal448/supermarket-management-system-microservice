import { Router } from "express";
import { StockRequestService } from "../../application/services/stockRequest.service";
import { StockRequestController } from "../controllers/stockRequest.controller";
import { authorizeRoles } from "../middleware/role.middleware";

import { StockRequestRepository } from "../../infrastructure/repositories/stockRequest.repository";
import { BranchInventoryRepository } from "../../infrastructure/repositories/branchInventory.repository";
import { StockRequestItemRepository } from "../../infrastructure/repositories/stockRequestItem.repository";

const router = Router();

// repositories
const requestRepo = new StockRequestRepository();
const itemRepo = new StockRequestItemRepository();
const inventoryRepo = new BranchInventoryRepository();

// service
const service = new StockRequestService(requestRepo, itemRepo, inventoryRepo);

// controller
const controller = new StockRequestController(service);

// manager routes
router.post("/", authorizeRoles("manager"), controller.createRequest);
router.get("/", authorizeRoles("manager", "admin"), controller.getRequest);

// admin approval
router.put("/item/:id/approve", authorizeRoles("admin"), controller.approveItem);
router.put("/item/:id/reject", authorizeRoles("admin"), controller.rejectItem);
router.put("/approve-all", authorizeRoles("admin"), controller.approveAllRequest);
router.get("/stock-requests", authorizeRoles( "admin"), controller.listAllPendingRequests);
router.get("/stock-requests-items/:requestId", authorizeRoles( "admin"), controller.getRequestItemsById);

export default router;
