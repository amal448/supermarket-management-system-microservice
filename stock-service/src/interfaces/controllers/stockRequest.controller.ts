import { Request, Response } from "express";
import { StockRequestService } from "../../application/services/stockRequest.service";
import { StockRequest } from "../../infrastructure/database/models/stockRequest.model";
import { RemoteUser } from "../../types/stocktypes";
import axios from "axios";
import mongoose from "mongoose";

export class StockRequestController {
  constructor(private service: StockRequestService) { }

  createRequest = async (req: Request, res: Response) => {
    const { items } = req.body;
    console.log("createRequest", req.body);
    const branchId = req.user!.branchId as string;
    const requestedBy = req.user!.id as string;
    const result = await this.service.createRequest({ branchId, requestedBy, items });
    res.status(201).json(result);
  }

  getRequest = async (req: Request, res: Response) => {

    const branchId = req.query.branchId as string;
    const status = req.query.status as string | undefined;
    const result = await this.service.getRequestsByBranch(branchId, status);
    res.json(result);
  }

  approveItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedQty } = req.body;
    console.log(id, approvedQty);

    const result = await this.service.approveItem(id, approvedQty);
    res.json(result);
  }

  rejectItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.rejectItem(id);
    res.json(result);
  }

  approveAllRequest = async (req: Request, res: Response) => {
    const { requestId } = req.body;
    const result = await this.service.approveAllRequest(requestId);
    res.json(result);
  }

listAllPendingRequests = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Fetch all users from User Microservice
    const usersResponse = await axios.get("http://localhost:5000/api/user/get-all-manager", {
      withCredentials: true,
    });

    console.log("user",usersResponse.data);
    
    const allUsers = usersResponse.data as Array<{ _id: string; username: string; email: string; role: string }>;
    const userMap = new Map(allUsers.map(u => [u._id, u]));

    // 2️⃣ Aggregate Stock Requests
    const result = await StockRequest.aggregate([
      // Only pending/rejected
      { $match: { status: { $ne: "APPROVED" } } },

      { $sort: { createdAt: -1 } },

      // Convert branchId to ObjectId in case it's stored as string
      {
        $addFields: {
          branchIdObj: { $toObjectId: "$branchId" }
        }
      },

      // Lookup branch
      {
        $lookup: {
          from: "branches",
          localField: "branchIdObj",
          foreignField: "_id",
          as: "branch"
        }
      },
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

      // Lookup stock request items
      {
        $lookup: {
          from: "stockrequestitems",
          localField: "_id",
          foreignField: "requestId",
          as: "items"
        }
      },

      // Lookup products
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDocs"
        }
      },

      // Map items and attach product details
      {
        $project: {
          _id: 1,
          branchId: 1,
          branchName: "$branch.name",
          requestedBy: 1,
          status: 1,
          createdAt: 1,
          notes: 1,
          items: {
            $map: {
              input: "$items",
              as: "i",
              in: {
                requestId: "$$i.requestId",
                requestItemId: "$$i._id",
                productId: "$$i.productId",
                requestedQty: "$$i.requestedQty",
                approvedQty: "$$i.approvedQty",
                status: "$$i.status",
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDocs",
                        as: "p",
                        cond: { $eq: ["$$p._id", "$$i.productId"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    // 3️⃣ Enrich with manager data
    const enriched = result.map(req => {
      const user = userMap.get(req.requestedBy?.toString());
      return {
        ...req,
        manager: user
          ? {
              id: user._id,
              name: user.username,
              email: user.email,
              role: user.role
            }
          : null
      };
    });

    // 4️⃣ Return
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stock requests" });
  }
};
 getRequestItemsById = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    // Aggregate to fetch items + product details for the specific request
    const result = await StockRequest.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(requestId) } },

      {
        $lookup: {
          from: "stockrequestitems",
          localField: "_id",
          foreignField: "requestId",
          as: "items"
        }
      },

      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDocs"
        }
      },

      {
        $project: {
          _id: 1,
          branchId: 1,
          branchName: "$branch.name",
          requestedBy: 1,
          status: 1,
          createdAt: 1,
          notes: 1,
          items: {
            $map: {
              input: "$items",
              as: "i",
              in: {
                requestId: "$$i.requestId",
                requestItemId: "$$i._id",
                productId: "$$i.productId",
                requestedQty: "$$i.requestedQty",
                approvedQty: "$$i.approvedQty",
                status: "$$i.status",
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDocs",
                        as: "p",
                        cond: { $eq: ["$$p._id", "$$i.productId"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    console.log("getRequestItemsId",result);
    if (!result || result.length === 0) return res.status(404).json({ error: "Request not found" });
    
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch request items" });
  }
};






}
