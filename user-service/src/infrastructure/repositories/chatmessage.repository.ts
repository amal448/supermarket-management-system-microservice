import { ChatMessage } from "../database/models/ChatMessage";

export class ChatMessageRepository {
  async saveMessage(data: {
    senderId: string;
    receiverId: string | null;
    message: string;
    type?: string;
  }) {
    return await ChatMessage.create({
      senderId: data.senderId,
      receiverId: data.receiverId,
      message: data.message,
      type: data.type || "chat",
    });
  }

async getChatHistory(userA: string, userB: string | null) {

    // ⭐ Broadcast case
    if (userB === "broadcast" || userB === null) {
      return ChatMessage
        .find({ type: "broadcast" })
        .sort({ createdAt: 1 })
        .lean();
    }

    // ⭐ Normal chat
    return ChatMessage.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();
  }
}
