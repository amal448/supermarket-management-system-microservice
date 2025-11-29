// src/interfaces/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../../application/services/user.service";
import { UserRepository } from "../../infrastructure/repositories/user.repositories";

const userRepo = new UserRepository();
const userService = new UserService(userRepo);

export const UserController = {

  create: async (req: Request, res: Response) => {
    try {
      const branchId = req.user?.branchId;
      console.log("UserControllerbranchId", branchId);

      if (!branchId) {
        return res.status(400).json({ message: "branchId missing from token" });
      }

      const user = await userService.createUser(req.body, branchId);
      res.status(201).json({ message: "User created successfully", user });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    console.log("update",req.body);
    
    try {
      const { id, ...data } = req.body;
      if (!id) throw new Error("User ID is required");

      const updatedUser = await userService.updateUser(id, data);
      res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!id) throw new Error("User ID is required");

      const updatedUser = await userService.deleteUser(id);
      res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getall: async (req: Request, res: Response) => {
    try {
      const user = req.user as { branchId: string };

      if (!user?.branchId) {
        return res.status(400).json({ message: "Branch ID missing" });
      }

      const users = await userService.getAllStaff(user.branchId);

      res.status(200).json(users);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getmanagers: async (_req: Request, res: Response) => {
    try {
      const users = await userService.getAll();
      res.status(200).json(users);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  getuser: async (req: Request, res: Response) => {
    console.log("Hi getuser", req.query);

    try {
      const { id } = req.query;
      if (!id || typeof id !== "string") throw new Error("User ID is required");

      const user = await userService.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.status(200).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
