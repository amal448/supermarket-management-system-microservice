import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import http from "http";

import { connectDB } from "./infrastructure/database/mongoose.connection";
import discountRoutes from "./presentation/routes/discount.routes";
import salesRoutes from "./presentation/routes/sale.routes";
import { stripeWebhook } from "./presentation/controllers/payment.controller";
import { errorHandler } from "./presentation/middleware/errorHandler";
import { connectProducer } from "./kafka/producer";
import { startProductInfoConsumer } from "./kafka/product/productConsumer";
import { initSocket } from "./application/services/socket.service";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();

app.post(
  "/api/payments/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhook
);


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://joyful-genie-aaea2e.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * 📦 Routes
 */
app.use("/api/discounts", discountRoutes);
app.use("/api/sales", salesRoutes);

/**
 * ❗ Error handler last
 */
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectProducer();
  await startProductInfoConsumer();
  await connectDB();

  server.listen(PORT, () => {
    logger.info(`✅ Sales service running on port ${PORT}`);
  });
}

startServer();
