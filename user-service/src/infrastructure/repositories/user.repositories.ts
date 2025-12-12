// src/infrastructure/repositories/user.repository.ts
import { UserModel, UserDocument } from "../database/models/user.model";
import { UserEntity } from "../../domain/entities/user.entity";

export class UserRepository {
  async create(userData: Partial<UserEntity>): Promise<UserDocument> {
    const user = new UserModel(userData);
    return await user.save();
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
  async delete(id: string, ): Promise<UserDocument | null> {
    return UserModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return UserModel.find({}).exec();
  }
  //used for chat list
  async findManagers(): Promise<UserDocument[]> {
    return UserModel.find({role:"manager"}).exec();
  }
  async findAllStaff(branchId: string): Promise<UserDocument[]> {
    return UserModel.find({ branchId }).exec();
  }


  async findById(id: string): Promise<UserDocument | null> {
    console.log("reached repo", id);

    return UserModel.findById(id).exec();
  }

}
