import mongoose, { Document, Schema } from "mongoose";
import type { UserEntity } from "../../../domain/entities/user.entity.js";

export interface UserDocument extends Omit<UserEntity, "id">, Document { }

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "manager", "cashier","staff"], default: "cashier" },
    isActive: { type: Boolean, default: false, trim: true },
    branchId: { type: String, required: false }

  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
