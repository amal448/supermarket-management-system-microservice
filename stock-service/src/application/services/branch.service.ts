// src/application/services/branch.service.ts
import axios from "axios";
import { BranchRepository } from "../../domain/repositories/branch.repository";
import { BranchEntity } from "../../domain/entities/branch.entity";

export class BranchService {
  constructor(private branchRepo: BranchRepository) { }

async createBranch(payload: any) {
  console.log("payload:", payload);

  // Extract data properly
  const data = payload.data;
  console.log("managerId:", data.managerId);

  // 1️⃣ Validate manager
  const res = await axios.get("http://localhost:5000/api/user/getuser", {
    params: { id: data.managerId },
    withCredentials: true,
  });

  const user = res.data;

  if (!user) throw new Error("Manager not found");
  if (user.role !== "manager") throw new Error("Selected user is not a manager");

  // 2️⃣ Create branch
  const createdBranch = await this.branchRepo.create(data);

  // 3️⃣ Update user with branchId
  const updateRes = await axios.post(
    // "http://localhost:5000/api/user/update-user",
    "/api/user/update-user",
    {
      id: data.managerId,
      branchId: createdBranch._id,
    },
    { withCredentials: true }
  );

  console.log("User updated:", updateRes.data);

  return createdBranch;
}




  async updateBranch(id: string, data: Partial<BranchEntity>) {
    return this.branchRepo.update(id, data);
  }

  async getBranchById(id: string) {
    return this.branchRepo.findById(id);
  }

  async getAllBranches() {
    return this.branchRepo.findAll();
  }
}
