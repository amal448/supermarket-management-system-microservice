import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { ChatMessageService } from "./chatmessage.service";
import { UserService } from "./user.service";
import { UserRepository } from "../../infrastructure/repositories/user.repositories";

export function setupSocket(httpServer: HTTPServer) {
  const chatService = new ChatMessageService();
  const userRepo = new UserRepository();

  const managerService = new UserService(userRepo);
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

    // Join user-specific room
    socket.on("join-room", (data: { userId: any; role: string }) => {
      if (!data) return;

      const id = String(data.userId);

      socket.join(`user:${id}`);
      console.log("🟢 Joined user room:", `user:${id}`);

      if (data.role === "admin") {
        socket.join("admin-room");
        console.log("🟢 Joined admin-room");
      }

      if (data.role === "manager") {
        socket.join("managers");
        console.log("🟢 Joined managers room");
      }
    });


    // Manager sends message to admin
    socket.on("manager-send-message", async ({ senderId, receiverId, message }) => {
      console.log("message send to admin", senderId, receiverId, message);

      await chatService.saveChat(senderId, receiverId, message, "chat");
      io.to(`user:${receiverId}`).emit("receive-message", {
        message,
        senderId: String(senderId),
        receiverId: String(receiverId),
        type: "chat",
        createdAt: new Date().toISOString()
      });

    });

    // Admin sends message to manager
    socket.on("admin-send-message", async ({ senderId, receiverId, message }) => {

      await chatService.saveChat(senderId, receiverId, message, "chat");
      console.log("message send to manager senderId, receiverId, message ", senderId, receiverId, message);
      io.to(`user:${receiverId}`).emit("receive-message", {
        message,
        senderId: String(senderId),
        receiverId: String(receiverId),
        type: "chat",
        createdAt: new Date().toISOString()
      });

    });

    // Admin sends broadcast to manager
    socket.on("admin-broadcast", async ({ senderId, message }) => {
      const managers = await managerService.getManagers();
      console.log("admin-broadcast",managers);
      
      managers.forEach(m => {
        chatService.saveChat(senderId,m._id.toString(), message, "broadcast");
        io.to(`user:${m._id}`).emit("receive-message", {
          message,
          senderId,
          receiverId: m._id,
          type: "broadcast",
          createdAt: new Date().toISOString()
        });
      });
    });

    socket.on("disconnect", () => {
      console.log("👋 User disconnected:", socket.id);
    });
  });

  return io;
}
