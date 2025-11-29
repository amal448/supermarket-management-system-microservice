import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from './interfaces/routes/auth.routes'
import userRoutes from './interfaces/routes/user.routes'
export const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Store Management Backend is running");
});
