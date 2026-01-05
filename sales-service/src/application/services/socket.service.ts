import { Server } from "socket.io";

let io: Server;

export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        cors: {
            origin: "https://joyful-genie-aaea2e.netlify.app",
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
