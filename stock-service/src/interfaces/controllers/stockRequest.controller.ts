import { Request, Response } from "express";
import { StockRequestService } from "../../application/services/stockRequest.service";
import { StockRequest } from "../../infrastructure/database/models/stockRequest.model";
import axios from "axios";
import mongoose from "mongoose";
import { InventoryService } from "../../application/services/inventory.service";
import { AggregatedStockRequest } from "../../types/stocktypes";

export class StockRequestController {
  constructor(
    private service: StockRequestService,
    private inventoryService: InventoryService
  ) { }

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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    try {
      // 1️⃣ Fetch managers
      const usersResponse = await axios.get(
        "http://localhost:5000/api/user/get-all-manager",
        { withCredentials: true }
      );

      const allUsers = usersResponse.data as Array<{
        _id: string;
        username: string;
        email: string;
        role: string;
      }>;

      const userMap = new Map(allUsers.map(u => [u._id, u]));

      // 2️⃣ Aggregation with pagination
      const result = await StockRequest.aggregate([
        { $match: { status: { $ne: "APPROVED" } } },
        { $sort: { createdAt: -1 } },

        {
          $addFields: {
            branchIdObj: { $toObjectId: "$branchId" }
          }
        },

        {
          $lookup: {
            from: "branches",
            localField: "branchIdObj",
            foreignField: "_id",
            as: "branch"
          }
        },
        { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },

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
                  requestItemId: "$$i._id",
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
        },

        // ✅ PAGINATION
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit }
            ],
            meta: [
              { $count: "total" }
            ]
          }
        }
      ]);

      // const data = result[0].data;
      const total = result[0].meta[0]?.total || 0;

      const data = result[0].data as AggregatedStockRequest[];

      const enriched = data.map((req: AggregatedStockRequest) => {
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

      // 4️⃣ Response
      res.json({
        data: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

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
        {
          $match: { _id: new mongoose.Types.ObjectId(requestId) }
        },

        // 🔹 Branch lookup
        {
          $lookup: {
            from: "branches",
            localField: "branchId",
            foreignField: "_id",
            as: "branch"
          }
        },
        {
          $unwind: {
            path: "$branch",
            preserveNullAndEmptyArrays: true
          }
        },

        // 🔹 Items lookup
        {
          $lookup: {
            from: "stockrequestitems",
            localField: "_id",
            foreignField: "requestId",
            as: "items"
          }
        },

        // 🔹 Products lookup
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
            status: 1,
            requestedBy: 1,
            createdAt: 1,

            // ✅ Branch details
            branch: {
              _id: "$branch._id",
              name: "$branch.name",
              location: "$branch.location",
              managerId: "$branch.managerId",
            },

            items: {
              $map: {
                input: "$items",
                as: "i",
                in: {
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


      console.log("getRequestItemsId", result);
      if (!result || result.length === 0) return res.status(404).json({ error: "Request not found" });

      res.json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch request items" });
    }
  };
  // getCurrentStockById = async (req: Request, res: Response) => {
  //   try {
  //     const branchId = req.user?.branchId; 
  //     const productId = req.params.productId;

  //     if (!branchId) {
  //       return res.status(400).json({ message: "Branch ID missing" });
  //     }

  //     const stock = await this.inventoryService.getCurrentStock(
  //       branchId as string,
  //       productId
  //     );

  //     res.json(stock);

  //   } catch (err) {
  //     const error = err as Error;
  //     res.status(500).json({ message: error.message });
  //   }
  // };






}
