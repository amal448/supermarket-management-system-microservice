import { Request, Response } from "express";
import { ChatMessageService } from "../../application/services/chatmessage.service";

const chatService = new ChatMessageService();



// Fetch chat history
export const getChatHistory = async (req: Request, res: Response) => {
    try {
        const { userId, otherId } = req.params;

        const messages = await chatService.getMessagesBetweenUsers(userId, otherId);

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal error" });
    }
};
