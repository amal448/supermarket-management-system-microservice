// src/domain/entities/user.entity.ts
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
  branchId?: string;
}
export type Role = "admin" | "manager" | "cashier";
