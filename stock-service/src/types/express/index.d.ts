import "express";
import { Role } from "../../domain/entities/user.entity";
declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      username: string;
      role: Role;
      branchId?: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
