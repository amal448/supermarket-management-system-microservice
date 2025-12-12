// src/interfaces/controllers/branch.controller.ts
import { Request, Response } from "express";
import { BranchService } from "../../application/services/branch.service";
import { BranchRepository } from "../../domain/repositories/branch.repository";

const branchRepo = new BranchRepository();
const branchService = new BranchService(branchRepo);

export const BranchController = {
  addBranch: async (req: Request, res: Response) => {
    try {
      console.log("addbranch",req.body);
      
      const result = await branchService.createBranch(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  editBranch: async (req: Request, res: Response) => {
    try {
      const result = await branchService.updateBranch(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getAllBranches: async (_req: Request, res: Response) => {
    try {
      const result = await branchService.getAllBranches();
      console.log("getallBranches",result);
      
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getBranch: async (req: Request, res: Response) => {
    try {
      const result = await branchService.getBranchById(req.params.id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
