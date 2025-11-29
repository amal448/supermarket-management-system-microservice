// src/interfaces/routes/branch.routes.ts
import { Router } from "express";
import { BranchController } from "../controllers/branch.controller";

const router = Router();

router.post("/add-branch", BranchController.addBranch);
router.put("/edit-branch/:id", BranchController.editBranch);
router.get("/all-branch", BranchController.getAllBranches);
router.get("/branch/:id", BranchController.getBranch);

export default router;
