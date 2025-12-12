// src/application/services/inventory.service.ts
import { Types } from "mongoose";
import { ProductEntity } from "../../domain/entities/product.entity";
import { AuthenticatedUser } from "../../domain/entities/user.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";
import { BranchInventory } from "../../infrastructure/database/models/branchInventory.model";
import { ProductModel } from "../../infrastructure/database/models/product.model";
// import { InventoryRepository } from "../../infrastructure/repositories/inventoryRepository";

function generateSKU(name: string, brand?: string, unit?: string) {
  const base = name.slice(0, 3).toUpperCase();
  const brandPart = brand ? brand.slice(0, 3).toUpperCase() : "GEN";
  const unitPart = unit ? unit.replace(/\s+/g, '').toUpperCase() : "STD";
  return `${base}-${brandPart}-${unitPart}-${Date.now()}`;
}

export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    // private inventoryRepo: InventoryRepository
  ) { }

  async addProduct(user: AuthenticatedUser, data: ProductEntity) {
    this.ensureAdmin(user);
    const existing = await this.productRepo.findOne(data.name, data.unit, data.brand);

    if (existing) {
      throw new Error("Product already exists in this branch");
    }

    let sku: string;
    let product: ProductEntity | null;

    do {
      sku = generateSKU(data.name, data.brand, data.unit);
      product = await this.productRepo.findBySKU(sku);
    } while (product); // repeat if product exists

    data.sku = sku;       // <-- assign generated SKU
    data.createdBy = user.id;

    return this.productRepo.create(data);
  }

  async listBranchProducts(branchId: string, showOutOfStock: boolean = false) {
    const branchObjectId = new Types.ObjectId(branchId);

    const pipeline: any[] = [
      { $match: {} },

      {
        $lookup: {
          from: "branchinventories",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$branchId", branchObjectId] },
                  ],
                },
              },
            },
          ],
          as: "inventory",
        },
      },
      { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "stockrequestitems",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$productId"] },
              },
            },
            {
              $lookup: {
                from: "stockrequests",
                localField: "requestId",
                foreignField: "_id",
                as: "req",
              },
            },
            { $unwind: "$req" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$req.branchId", branchObjectId] },
                    { $eq: ["$req.status", "PENDING"] },
                  ],
                },
              },
            },
            {
              $project: {
                requestedQty: 1,
                _id: 0,
              },
            },
          ],
          as: "requests",
        },
      },

      // compute final fields
      {
        $addFields: {
          stock: { $ifNull: ["$inventory.stock", 0] },
          requiredLevel: { $ifNull: ["$inventory.requiredLevel", 10] },
          inBranch: { $cond: [{ $gt: ["$inventory", null] }, true, false] },
          isRequested: { $gt: [{ $size: "$requests" }, 0] },
          requestedQty: { $ifNull: [{ $arrayElemAt: ["$requests.requestedQty", 0] }, 0] },
          branchId: branchObjectId,
        },
      },
    ];

    // ➜ ADD CONDITIONALLY the $match
    if (!showOutOfStock) {
      pipeline.push({
        $match: { stock: { $gt: 0 } }
      });
    }

    pipeline.push({
      $project: {
        inventory: 0,
        requests: 0,
      }
    });

    return ProductModel.aggregate(pipeline);
  }

  async validateStockForCart(payload: {
  branchId: string;
  items: Array<{
    productId: string;
    qty: number;
    freeUnits?: number;
  }>;
}) {
  const { branchId, items } = payload;

  const results = [];

  for (const item of items) {
    const { productId, qty, freeUnits = 0 } = item;

    const totalRequested = qty + freeUnits;

    // reuse your existing method
    const stock = await this.getCurrentStock(branchId, productId);

    const available = stock?.stockQty ?? 0;

    if (available >= totalRequested) {
      results.push({
        productId,
        requested: totalRequested,
        available,
        ok: true
      });
    } else {
      results.push({
        productId,
        requested: totalRequested,
        available,
        ok: false,
        message: `Only ${available} left`
      });
    }
  }

  const allOk = results.every((r) => r.ok);
console.log("before return,allOk",allOk,results);

  return {
    valid: allOk,
    results
  };
}





  
async getCurrentStock(branchId: string, productId: string) {
  const item = await BranchInventory.findOne({ branchId, productId });

  if (!item) {
    return { stockQty: 0, isOut: true };
  }

  return {
    stockQty: item.stock,
    isOut: item.stock === 0
  };
}


  async updateProduct(user: AuthenticatedUser, id: string, data: Partial<ProductEntity>) {
    this.ensureManagerOrAdmin(user);
    return this.productRepo.update(id, data);
  }

  async getProducts() {
    return this.productRepo.findAll();
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  async deleteProduct(user: AuthenticatedUser, id: string) {
    this.ensureAdmin(user);
    return this.productRepo.delete(id);
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== "admin") throw new Error("Forbidden: Admin only");
  }

  private ensureManagerOrAdmin(user: AuthenticatedUser) {
    if (!["admin", "manager"].includes(user.role)) {
      throw new Error("Forbidden: Manager/Admin only");
    }
  }
}
