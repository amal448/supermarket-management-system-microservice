import dotenv from "dotenv";
import { server } from "./app";
import { connectDB } from "./infrastructure/database/mongo";
import { startStockConsumer } from "./kafka/consumer";
import { setupSocket } from "./application/services/socket.service";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startStockConsumer().catch(err => console.error("Kafka error:", err));
    
    try {
      console.log("📡 About to setupSocket");
      setupSocket(server);
      console.log("✅ Socket setup complete");
      console.error("✅ Socket setup complete"); // Force output
    } catch (err) {
      console.error("❌ Socket setup failed:", err);
      if (err instanceof Error) {
        console.error("Error details:", err.message, err.stack);
      }
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
