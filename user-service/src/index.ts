import dotenv from "dotenv";
import { app } from "./app";
import { connectDB } from "./infrastructure/database/mongo";
// import { connectRedis } from "./infrastructure/database/redis";
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect databases first
    await connectDB();
    // await connectRedis()

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
