import { Server } from "socket.io";

let io: Server;

export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    io.on("connection", () => {
        console.log("📡 Sales Service Socket connected");
    });

    return io;
};

export const getIO = () => io;
