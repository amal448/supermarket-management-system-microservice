import { ChatMessageRepository } from "../../infrastructure/repositories/chatmessage.repository";

export class ChatMessageService {
  private repo = new ChatMessageRepository();

  async saveChat(senderId: string, receiverId: string | null, message: string, type?: string) {
    return this.repo.saveMessage({ senderId, receiverId, message, type });
  }

  async getMessagesBetweenUsers(userA: string, userB: string | null) {
    // return await this.repo.getChatHistory(userA, userB);
    // const data= await this.repo.getChatHistory(userA, userB);
    // console.log("getMessagesBetweenUsers",data);
    return await this.repo.getChatHistory(userA, userB);
    
  }
}
