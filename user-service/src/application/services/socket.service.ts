import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

export function setupSocket(httpServer: HTTPServer) {
  console.log("📡 setupSocket CALLED");
  // Create Socket.io server
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"],
    allowEIO3: true
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("🔥 User connected:", socket.id);
    
    // Listen for events from frontend
    socket.on("join-branch", (branchId: string) => {
      console.log("➡️ join-branch:", branchId);
      socket.join(branchId);
    });

    socket.on("disconnect", () => {
      console.log("👋 User disconnected:", socket.id);
    });
  });

  return io;
}
