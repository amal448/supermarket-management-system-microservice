
// import { Redis } from "ioredis";

// export const redis = new Redis({
//   host: "127.0.0.1",
//   port: 6379,
// });


// export const connectRedis = async () => {
//   redis.on("connect", () => console.log("✅ Redis connected"));
//   redis.on("ready", () => console.log("🎯 Redis ready to use"));
//   redis.on("error", (err: Error) => console.error("❌ Redis error:", err));
//   redis.on("reconnecting", () => console.log("♻️ Redis reconnecting..."));

//   try {
//     const pong = await redis.ping();
//     console.log("Redis Ping:", pong);
//   } catch (err) {
//     console.error("Redis ping failed:", err);
//   }
// };
