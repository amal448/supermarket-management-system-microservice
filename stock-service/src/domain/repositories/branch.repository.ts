// src/domain/repositories/branch.repository.ts
import { BranchEntity } from "../entities/branch.entity";
import { BranchModel } from "../../infrastructure/database/models/branch.model";

export class BranchRepository {
  async create(branch: BranchEntity) {
    const newBranch = new BranchModel(branch);
    console.log("newBranch");
    
    return await newBranch.save();
  }

  async update(id: string, data: Partial<BranchEntity>) {
    return BranchModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findById(id: string) {
    return BranchModel.findById(id).exec();
  }

  async findAll() {
    return BranchModel.find().exec();
  }
}
