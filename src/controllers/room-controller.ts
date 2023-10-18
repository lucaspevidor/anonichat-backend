import { type Request, type Response } from "express";
import { db } from "../services/db";
import { io } from "../socket";

interface IRoomUpdate {
  name?: string
}

class RoomController {
  async create(req: Request, res: Response) {
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
        },
        include: { messages: { take: 200 } }
      });

      await db.user.update({
        where: { id: user.id },
        data: { roomIDs: [...user.roomIDs, room.id] }
      });

      io.to(userId).emit("room-created", room);
      return res.status(201).json(room);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req: Request<any, any, IRoomUpdate>, res: Response) {
    try {
      const { roomId } = req.params;
      const { name } = req.body;

      if (!roomId) return res.status(400).json({ error: "Missing room ID" });
      if (!name) return res.status(400).json({ error: "Missing room name" });

      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (room.ownerId !== req.user.id) return res.status(401).json({ error: "Unauthorized" });

      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: {
          name
        }
      });

      io.to(roomId).emit("name-changed", updatedRoom);
      return res.json(updatedRoom);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async read(req: Request, res: Response) {
    try {
      const { roomId } = req.params;

      if (!roomId) return res.status(400).json({ error: "Missing room ID" });

      const room = await db.room.findUnique({ where: { id: roomId }, include: { members: { select: { username: true, id: true } } } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (!room.memberIDs.includes(req.user.id)) return res.status(401).json({ error: "Unauthorized" });

      return res.json(room);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async addUser(req: Request, res: Response) {
    try {
      const { roomId, username } = req.params;

      if (!roomId) return res.status(400).json({ error: "Missing room ID" });
      if (!username) return res.status(400).json({ error: "Missing username" });

      const room = await db.room.findUnique({ where: { id: roomId }, include: { members: true } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (room.ownerId !== req.user.id) return res.status(401).json({ error: "Unauthorized" });
      if (room.members.find(m => m.username === username)) return res.status(400).json({ error: "User is already a member of the channel" });

      const user = await db.user.findUnique({ where: { username } });
      if (!user) return res.status(400).json({ error: "User does not exist" });

      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: {
          memberIDs: [...room.memberIDs, user.id]
        },
        include: {
          messages: {
            take: 200,
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      });

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          roomIDs: [...user.roomIDs, updatedRoom.id]
        }
      });

      updatedRoom.messages = updatedRoom.messages.sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      io.to(user.id).emit("room-inserted", updatedRoom);
      io.to(roomId).emit("user-added", user.id, user.username, updatedRoom);
      return res.json(updatedRoom);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async removeUser(req: Request, res: Response) {
    try {
      const { roomId, userId } = req.params;

      if (!roomId) return res.status(400).json({ error: "Missing room ID" });
      if (!userId) return res.status(400).json({ error: "Missing user ID" });

      const room = await db.room.findUnique({ where: { id: roomId } });
      if (!room) return res.status(400).json({ error: "Room not found" });
      if (room.ownerId !== req.user.id && userId !== req.user.id) return res.status(401).json({ error: "Unauthorized" });
      if (!room.memberIDs.includes(userId)) return res.status(400).json({ error: "User is not a member of the channel" });
      if (room.ownerId === userId) return res.status(400).json({ error: "The owner of the room cannot be removed" });

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(400).json({ error: "User not found" });

      await db.user.update({
        where: { id: userId },
        data: {
          roomIDs: user.roomIDs.filter(r => r !== roomId)
        }
      });

      const updatedRoom = await db.room.update({
        where: { id: roomId },
        data: {
          memberIDs: room.memberIDs.filter(m => m !== userId)
        }
      });

      io.to(roomId).emit("user-removed", userId, updatedRoom);
      return res.json(updatedRoom);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async index(req: Request, res: Response) {
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

  async load(req: Request, res: Response) {
    const { id: userId } = req.user;

    try {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(401).json({ error: "User not found" });

      const roomsWithMessages = await db.room.findMany({
        where: {
          id: {
            in: user.roomIDs
          }
        },
        include: {
          messages: {
            take: 200,
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      });

      roomsWithMessages.forEach(r => {
        r.messages = r.messages.sort((a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime()
        );
      });

      return res.json(roomsWithMessages);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
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

      io.to(roomId).emit("room-deleted", deleted);
      return res.status(200).json(deleted);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new RoomController();
