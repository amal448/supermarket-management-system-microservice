import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import stockRequestRoutes from './interfaces/routes/stockRequest.routes'
import branchRoutes from './interfaces/routes/branch.routes'
import inventoryRoutes from "./interfaces/routes/inventory.routes";
export const app = express();

// app.use(cors({ origin:["http://localhost:5173","https://joyful-genie-aaea2e.netlify.app"], credentials: true }));
const allowedOrigins = [
  "http://localhost:5173",
  "https://joyful-genie-aaea2e.netlify.app"
];
app.use(cors({
  origin: function (origin, callback) {
    // allow REST tools like Postman (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("/api/*", cors());

// VERY IMPORTANT

app.use(express.json());
app.use(cookieParser());

app.use("/api/stock", stockRequestRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/inventory", inventoryRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Store Management Backend is running");
});
