import dotenv from "dotenv";
import { app } from "./app"
import { connectDB } from "./infrastructure/database/models/mongoose";
import { startSaleConsumer } from "./kafka/consumer";
import { connectProducer } from "./kafka/producer";
import { connectProductProducer } from "./kafka/productProducer/productProducer";
dotenv.config();

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  try {
    // Connect databases first
    await connectDB();
    await connectProducer();
    await connectProductProducer()
    await startSaleConsumer();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
