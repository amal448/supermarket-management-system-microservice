import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import stockRequestRoutes from './interfaces/routes/stockRequest.routes'
import branchRoutes from './interfaces/routes/branch.routes'
import inventoryRoutes from "./interfaces/routes/inventory.routes";
export const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/stock", stockRequestRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/inventory", inventoryRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Store Management Backend is running");
});
