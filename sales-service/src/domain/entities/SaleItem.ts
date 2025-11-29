export interface SaleItemEntity {
  _id?: string;
  saleId?: string;
  productId: string;
  unitPrice: number;
  quantity: number;
  appliedDiscountName?: string | null;
  appliedDiscountAmount: number;
  freeUnits: number;
  total: number;
  createdAt?: Date;
}
