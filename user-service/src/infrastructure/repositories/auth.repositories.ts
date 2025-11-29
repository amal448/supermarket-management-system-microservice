import { UserModel } from "../database/models/user.model";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserDocument } from "../database/models/user.model";

export const UserRepository = {
  async create(userData: UserEntity) {
    const user = new UserModel(userData);
    return await user.save();
  },
    async update(id: string, data: Partial<UserEntity>): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },
  async findByEmail(email: string) {
    return await UserModel.findOne({ email });
  },
  async findAll(): Promise<UserDocument[]> {
    return UserModel.find().exec();
  },
  async findById(id: string) {
    return await UserModel.findById(id);
  },
};
