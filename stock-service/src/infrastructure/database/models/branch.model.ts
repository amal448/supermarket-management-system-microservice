import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    managerId: { type: String, required: true }, // store manager's userId as string
  },
  { timestamps: true }
);

export const BranchModel = mongoose.model("Branch", branchSchema);
