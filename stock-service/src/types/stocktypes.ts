export interface RemoteUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}
export interface AggregatedStockRequest {
  _id: string;
  branchId: string;
  branchName?: string;
  requestedBy: string;
  status: "PENDING" | "PARTIALLY_APPROVED" | "APPROVED" | "REJECTED";
  createdAt: Date;
  items: any[];
}
