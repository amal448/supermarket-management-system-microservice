// src/application/services/inventory.service.ts
import { Types } from "mongoose";
import { ProductEntity } from "../../domain/entities/product.entity";
import { AuthenticatedUser } from "../../domain/entities/user.entity";
import { ProductRepository } from "../../domain/repositories/product.repository";
import { BranchInventory } from "../../infrastructure/database/models/branchInventory.model";
import { ProductModel } from "../../infrastructure/database/models/product.model";

function generateSKU(name: string, brand?: string, unit?: string) {
  const base = name.slice(0, 3).toUpperCase();
  const brandPart = brand ? brand.slice(0, 3).toUpperCase() : "GEN";
  const unitPart = unit ? unit.replace(/\s+/g, '').toUpperCase() : "STD";
  return `${base}-${brandPart}-${unitPart}-${Date.now()}`;
}

export class InventoryService {
  constructor(private productRepo: ProductRepository) { }

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

  async listBranchProducts(branchId: string) {
    const branchObjectId = new Types.ObjectId(branchId);
    console.log(branchObjectId);

    return ProductModel.aggregate([
      // 1️⃣ Match all products
      { $match: {} },

      // 2️⃣ Lookup branch inventory for each product
      {
        $lookup: {
          from: "branchinventories",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    // Ensure types match: productId as ObjectId
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

      // 3️⃣ Lookup pending stock requests
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
                    { $eq: ["$req.branchId", branchObjectId] }, // type-safe
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

      // 4️⃣ Compute fields for frontend
      {
        $addFields: {
          stock: { $ifNull: ["$inventory.stock", 0] },
          requiredLevel: { $ifNull: ["$inventory.requiredLevel", 10] },
          inBranch: { $cond: { if: { $gt: ["$inventory", null] }, then: true, else: false } },
          isRequested: { $gt: [{ $size: "$requests" }, 0] },
          requestedQty: { $ifNull: [{ $arrayElemAt: ["$requests.requestedQty", 0] }, 0] },
          branchId: branchObjectId
        },
      },

      // 5️⃣ Cleanup unnecessary fields
      {
        $project: {
          inventory: 0,
          requests: 0,
        },
      },
    ]);
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
