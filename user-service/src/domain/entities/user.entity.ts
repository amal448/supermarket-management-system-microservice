export type Role = "admin" | "manager" | "cashier"|"staff";

export interface UserEntity {
    id?: string,
    username: string,
    email: string,
    password: string,
    role: "admin" | "manager" | "cashier"|"staff";
    isActive: boolean;
    branchId?:string;

}

export interface AuthenticatedUser {
    id: string;
    role: Role;
}