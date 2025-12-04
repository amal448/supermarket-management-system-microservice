// src/interfaces/controllers/inventory.controller.ts
import { Request, Response } from "express";
import { InventoryService } from "../../application/services/inventory.service";
import { ProductRepository } from "../../domain/repositories/product.repository";

const inventoryService = new InventoryService(new ProductRepository());

export const InventoryController = {
  addProduct: async (req: Request, res: Response) => {
    try {
      console.log("addProduct", req.body);

      const result = await inventoryService.addProduct(req.user!, req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  },

  updateProduct: async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.updateProduct(req.user!, req.params.id, req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  },

  deleteProduct: async (req: Request, res: Response) => {
    try {
      const result = await inventoryService.deleteProduct(req.user!, req.params.id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  },

  getProducts: async (_req: Request, res: Response) => {
    try {
      const result = await inventoryService.getProducts();
      console.log("getProducts results", result);

      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getProductById: async (req: Request, res: Response) => {
    console.log("getProductById");
    try {

      const result = await inventoryService.getProductById(req.params.id);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  },

  async getBranchInventory(req: Request, res: Response) {
    const user = req.user as { branchId: string };
    console.log("user.branchId",user.branchId);
    
    const result = await inventoryService.listBranchProducts(user.branchId);
    return res.json(result);
  }














};
