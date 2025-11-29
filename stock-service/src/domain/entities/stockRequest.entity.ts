export interface CreateStockRequestItemDTO {
  productId: string;
  qty: number;
}

export interface CreateStockRequestDTO {
  branchId: string;
  requestedBy: string;
  items: CreateStockRequestItemDTO[];
}
