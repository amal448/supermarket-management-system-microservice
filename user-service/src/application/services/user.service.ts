// src/application/services/user.service.ts
import { UserEntity } from "../../domain/entities/user.entity";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../infrastructure/repositories/user.repositories";

export class UserService {
  constructor(private userRepo: UserRepository) { }

  async createUser(data: Partial<UserEntity>, branchId: string) {
    if (!data.password) throw new Error("Password is required");
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.userRepo.create({
      ...data,
      branchId,
      password: hashedPassword,
    });
  }

  async updateUser(id: string, data: Partial<UserEntity>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.userRepo.update(id, data);
  }
  async deleteUser(id: string) {
    
    return this.userRepo.delete(id);
  }

  async getAllStaff(branchId: string) {
    return this.userRepo.findAllStaff(branchId);
  }
  async getAll() {
    return this.userRepo.findAll();
  }


  async getUserById(id: string) {
    return this.userRepo.findById(id);
  }
}
