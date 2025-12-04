import { Server as SocketIOServer } from "socket.io";

declare global {
  // Add your io instance to global type
  var io: SocketIOServer;
}

export {};
