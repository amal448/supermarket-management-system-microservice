export interface ProductEntity {
  _id?: string;
  name: string;
  sku: string;
  category: string;
  unit: string;         // kg, g, pcs
  brand: string;
  costPrice: number;
  sellingPrice: number;
  createdBy:string; // Admin who added
}
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
