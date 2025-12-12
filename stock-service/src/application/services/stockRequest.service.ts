import { IStockRequestRepository } from "../../domain/repositories/stockRequest.repository";
import { IStockRequestItemRepository } from "../../domain/repositories/stockRequestItem.repository";
import { IBranchInventoryRepository } from "../../domain/repositories/branchInventory.repository";

export class StockRequestService {
  constructor(
    private requestRepo: IStockRequestRepository,
    private itemRepo: IStockRequestItemRepository,
    private inventoryRepo: IBranchInventoryRepository
  ) { }

  async createRequest(input: { branchId: string; requestedBy: string; items: { productId: string; quantity: number }[] }) {
    const request = await this.requestRepo.createRequest({ branchId: input.branchId, requestedBy: input.requestedBy });
    const itemsData = input.items.map(i => ({ requestId: request._id.toString(), productId: i.productId, requestedQty: i.quantity }));
    const savedItems = await this.itemRepo.createManyItems(itemsData);
    return { request, items: savedItems };
  }

  async getRequestsByBranch(branchId: string, status?: string) {
    const requests = await this.requestRepo.findByBranchId(branchId, status);

    const requestIds = requests.map(r => r._id.toString());

    const items = await Promise.all(
      requestIds.map(id => this.itemRepo.findByRequestId(id))
    );

    return {
      requests,
      items: items.flat()
    };
  }


  async approveItem(itemId: string, qty: number) {
    console.log("itemId", itemId);

    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error("Item not found");

    item.approvedQty = qty;
    item.status = "APPROVED";
    await item.save();

    const request = await this.requestRepo.findById(item.requestId.toString());
    if (!request) throw new Error("Request not found");

    await this.inventoryRepo.addStock(request.branchId, item.productId.toString(), qty);

    const allItems = await this.itemRepo.findByRequestId(request._id.toString());
    request.status = allItems.every(i => i.status === "APPROVED") ? "APPROVED" :
      allItems.every(i => i.status === "REJECTED") ? "REJECTED" : "PARTIALLY_APPROVED";
    await request.save();

    return { request, item };
  }

  async rejectItem(itemId: string) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error("Item not found");

    item.status = "REJECTED";
    await item.save();

    const request = await this.requestRepo.findById(item.requestId.toString());
    if (!request) throw new Error("Request not found");

    const allItems = await this.itemRepo.findByRequestId(request._id.toString());
    request.status = allItems.every(i => i.status === "REJECTED") ? "REJECTED" :
      allItems.every(i => i.status === "APPROVED") ? "APPROVED" : "PARTIALLY_APPROVED";
    await request.save();

    return { request, item };
  }

  async approveAllRequest(requestId: string) {
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new Error("Request not found");

    const items = await this.itemRepo.findByRequestId(requestId);
    for (const item of items) {
      item.approvedQty = item.requestedQty;
      item.status = "APPROVED";
      await item.save();
      await this.inventoryRepo.addStock(request.branchId, item.productId.toString(), item.approvedQty);
    }
    request.status = "APPROVED";
    await request.save();

    return { request, items };
  }
}
