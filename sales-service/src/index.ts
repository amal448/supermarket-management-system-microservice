import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './infrastructure/database/mongoose.connection';
import discountRoutes from './presentation/routes/discount.routes'
import salesRoutes from './presentation/routes/sale.routes'
import { logger } from './utils/logger';
import { errorHandler } from './presentation/middleware/errorHandler';
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { stripeWebhook } from './presentation/controllers/payment.controller';
import { connectProducer } from './kafka/producer';
import { startProductInfoConsumer } from './kafka/product/productConsumer';
import http from "http";
import { initSocket } from './application/services/socket.service';
dotenv.config();


const app = express();
app.post(
    "/api/payments/stripe-webhook",
    bodyParser.raw({ type: "application/json" }), // must be raw for signature
    stripeWebhook
);

app.use(express.json());
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

// VERY IMPORTANT
app.options("*", cors());

app.use(cookieParser());


// Routes
app.use("/api/discounts", discountRoutes);
app.use("/api/sales", salesRoutes)

// error handler
app.use(errorHandler);

const server = http.createServer(app);

initSocket(server);
const PORT = process.env.PORT || 4000;

async function startServer() {

    await connectProducer();
    await startProductInfoConsumer().catch(console.error);
    await connectDB()
        .then(() => {
            server.listen(PORT, () => {
                logger.info(`Sales service listening on port ${PORT}`);
            });
        })
        .catch((err) => {
            logger.error('Failed to start:', err);
            process.exit(1);
        });

}
startServer()