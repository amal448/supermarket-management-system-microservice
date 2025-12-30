// src/interfaces/controllers/inventory.controller.ts
import { Request, Response } from "express";
import { inventoryService } from "../../application/serviceFactory";

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

  getProducts: async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const search = String(req.query.search || "");

      const result = await inventoryService.getProducts(page, limit, search);

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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const search = String(req.query.search || "");

    const user = req.user as { branchId: string, role: String };
    console.log("user", user);
    const showOutOfStock = user.role === "manager";
    console.log("showOutOfStock", showOutOfStock);

    const result = await inventoryService.listBranchProducts(
      user.branchId,
      showOutOfStock,
      page, limit, search
    );
    return res.json(result);
  },
  async checkBranchInventoryStock(req: Request, res: Response) {
    console.log("checkBranchInventoryStockcheckBranchInventoryStock", req.body);

    try {
      const user = req.user as { branchId: string; role: string };
      const { branchId, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      const result = await inventoryService.validateStockForCart({
        branchId: branchId,
        items
      });

      return res.json(result);

    } catch (err: any) {
      console.error("Stock validation error:", err);
      return res.status(500).json({ message: err.message });
    }
  }














};
