// src/domain/entities/branch.entity.ts
export interface BranchEntity {
  id?: string;
  name: string;
  location?: string;
  managerId: string; // should refer to User id
}
