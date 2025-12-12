import { Schema, model, Document } from "mongoose";

export interface ChatMessageDocument extends Document {
  senderId: string;        // admin or manager
  receiverId: string | null; // null = broadcast
  message: string;
  type: string;            // "chat" | "info" | "alert"
  createdAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessageDocument>(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, default: null },
    message: { type: String, required: true },
    type: { type: String, default: "chat" }
  },
  { timestamps: true }
);

export const ChatMessage = model<ChatMessageDocument>("ChatMessage", ChatMessageSchema);
