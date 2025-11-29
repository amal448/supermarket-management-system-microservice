import { IDiscountRepository } from "../../domain/repositories/IDiscountRepository";
import { DiscountEntity } from "../../domain/entities/DiscountEntity";

export class DiscountService {
  constructor(private repo: IDiscountRepository) { }

  async createDiscount(input: Partial<DiscountEntity>): Promise<DiscountEntity> {
    await this.validateBeforeCreate(input);
    return this.repo.create(input as Partial<DiscountEntity>);
  }

  async updateDiscount(id: string, input: Partial<DiscountEntity>) {
    // optional: validate changes similarly
    await this.validateBeforeUpdate(id, input);
    return this.repo.update(id, input as Partial<DiscountEntity>);
  }

  private async validateBeforeCreate(d: Partial<DiscountEntity>) {
    // date check
    console.log(d);
    
    if (!d.startDate || !d.endDate) throw new Error("startDate and endDate required");
    if (new Date(d.startDate) >= new Date(d.endDate)) throw new Error("startDate must be before endDate");

    // type-specific
    if (!d.type) throw new Error("type required");

    if (d.type === "PRODUCT_PERCENTAGE") {
      if (!d.productId) throw new Error("productId required for product discount");
      if (!d.percentage || d.percentage < 1 || d.percentage > 30) throw new Error("percentage 1-50 required");
      const existing = await this.repo.findActiveProductDiscount(d.productId);
      // ❗ allow update for the SAME discount
      if (existing && existing.id !== d.id) {
        throw new Error("Only 1 active product discount allowed for this product");
      }
    }
    else if (d.type === "PRODUCT_FLAT") {
      if (!d.productId) throw new Error("productId required for product discount");
      if (!d.flatAmount || d.flatAmount <= 0) throw new Error("flatAmount > 0 required");
      const existing = await this.repo.findActiveProductDiscount(d.productId);
      // ❗ allow update for the SAME discount
      if (existing && existing.id !== d.id) {
        throw new Error("Only 1 active product discount allowed for this product");
      }
      // Product price check requires product service; skip here or call external product repo
    }
    else if (d.type === "BUY_X_GET_Y") {
      if (!d.productId) throw new Error("productId required for buy-x-get-y");
      if (!d.buyQty || !d.getQty) throw new Error("buyQty and getQty required");
      if (d.buyQty < 1 || d.getQty < 1) throw new Error("buyQty and getQty must be >=1");
      const existing = await this.repo.findActiveProductDiscount(d.productId);
      console.log("existing", existing);

      // ❗ allow update for the SAME discount
      if (existing && existing.id !== d.id) {
        throw new Error("Only 1 active product discount allowed for this product");
      }
    }
    else if (d.type === "CART_PERCENTAGE") {

      // Only 1 cart discount offer can be active
      const existingCart = await this.repo.findActiveCartDiscount();
      if (existingCart && existingCart.id !== d.id) {
        throw new Error("Only 1 active product discount allowed for this product");
      }
      // Admin MUST provide a min purchase
      if (!d.minPurchaseAmount || d.minPurchaseAmount <= 0) {
        throw new Error("minPurchaseAmount is required and must be > 0");
      }

      // Example: Admin sets 100000 paise for ₹1000
      if (!d.percentage || d.percentage < 1 || d.percentage > 20) {
        throw new Error("Cart percentage discount must be between 1 and 20");
      }
    }

  }

  private async validateBeforeUpdate(id: string, input: Partial<DiscountEntity>) {
    // For simplicity, reuse create rules when activating
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Discount not found");
    // If toggling to active or changing product/cart, run create validation with new data
    if (input.isActive === true || input.type || input.productId) {
      const merged = { ...existing, ...input, id } as Partial<DiscountEntity>;

      await this.validateBeforeCreate(merged);
    }
  }
}
