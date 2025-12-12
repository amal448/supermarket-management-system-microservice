import { InventoryService } from "./services/inventory.service";
import { ProductRepository } from "../domain/repositories/product.repository";
// import { InventoryRepository } from "../infrastructure/repositories/inventoryRepository";

export const inventoryService = new InventoryService(
  new ProductRepository(),
//   new InventoryRepository()
);
