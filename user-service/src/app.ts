import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from './interfaces/routes/auth.routes';
import userRoutes from './interfaces/routes/user.routes';
import socketRoutes from "./interfaces/routes/chat.routes";

export const app = express();

// Middlewares
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
     return  callback(null, true);
    } 
     console.warn("Blocked CORS request from:", origin);
    return callback(null, false); // reject silently in production
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests globally
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// VERY IMPORTANT

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use("/api/socket", socketRoutes);
app.get("/", (req, res) => {
  res.send("🚀 Backend running");
});

// Create HTTP server
export const server = http.createServer(app);
