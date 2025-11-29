import "express";
import { Role } from "../../domain/entities/userEntity";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      role: Role;
      branchId: string;
    };
  }
}
