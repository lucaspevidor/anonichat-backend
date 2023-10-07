import { type Request, type Response } from "express";
import { db } from "../services/db";

interface IMessageCreate {
  content: string
}

class MessageController {
  async create (req: Request<any, any, IMessageCreate>, res: Response) {
    const { id, username } = req.user;
    const { content } = req.body;
    const { roomId } = req.params;

    try {
      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) return res.status(404).json({ error: "Room not found" });

      if (!room.memberIDs.includes(id)) return res.status(401).json({ error: "Unauthorized" });

      const message = await db.message.create({
        data: {
          senderName: username,
          content,
          roomId
        }
      });

      return res.json(message);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async index (req: Request, res: Response) {
    const { id } = req.user;
    const { roomId } = req.params;
    // Todo pagination

    try {
      const room = await db.room.findUnique({ where: { id: roomId }, include: { messages: true } });
      if (!room) return res.status(404).json({ error: "Room not found" });
      if (!room.memberIDs.includes(id)) return res.status(401).json({ error: "Unauthorized" });

      return res.json(room.messages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new MessageController();
