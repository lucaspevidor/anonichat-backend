import { type Request, type Response } from "express";
import { db } from "../services/db";

interface IRoomUpdate {
  name?: string
  memberIDs?: string[]
}

class RoomController {
  async create (req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const roomName = req.params.name;

      if (!roomName) return res.status(400).json({ error: "Missing room name" });

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(401).json({ error: "User not found" });

      const room = await db.room.create({
        data: {
          name: roomName,
          memberIDs: [userId],
          ownerId: userId
        }
      });

      await db.user.update({ where: { id: user.id }, data: { roomIDs: [...user.roomIDs, room.id] } });

      return res.status(201).json(room);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update (req: Request<any, any, IRoomUpdate>, res: Response) {
    try {
      const { roomId } = req.params;
      const { name, memberIDs } = req.body;

      if (!roomId) return res.status(400).json({ error: "Missing room ID" });
      if (!name && !memberIDs) return res.status(400).json({ error: "Missing room name and member IDs" });

      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (room.ownerId !== req.user.id) return res.status(401).json({ error: "Unauthorized" });

      if (memberIDs && !memberIDs.includes(req.user.id)) {
        return res.status(400).json({ error: "Owner not included in member list" });
      }

      // Todo - add user checking

      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: {
          name,
          memberIDs
        }
      });

      return res.json(updatedRoom);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async index (req: Request, res: Response) {
    const { id: userId } = req.user;

    try {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(401).json({ error: "User not found" });

      const rooms = await db.room.findMany({ where: { id: { in: user.roomIDs } } });
      return res.json(rooms);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete (req: Request, res: Response) {
    const { id } = req.user;
    const { roomId } = req.params;

    try {
      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (room.ownerId !== id) return res.status(401).json({ error: "Unauthorized" });

      const promises = room.memberIDs.map(async member => {
        const user = db.user.findUnique({ where: { id: member } })
          .then(async foundUser => {
            if (foundUser) {
              const idsWithout = foundUser?.roomIDs.filter(rId => rId !== roomId);
              return await db.user.update({
                where: { id: foundUser.id },
                data: {
                  roomIDs: idsWithout
                }
              });
            }
          });
        return await user;
      });
      await Promise.all(promises);

      const deleted = await db.room.delete({ where: { id: roomId } });

      return res.status(200).json(deleted);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new RoomController();
