import { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { io } from "../socket";

import { db } from "../services/db";

interface IUserCreate {
  username: string
  password: string
}

class UserController {
  async create(req: Request<any, IUserCreate>, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    try {
      const userExists = await db.user.findFirst({ where: { username } });
      if (userExists) { return res.status(400).json({ error: "Username already exists" }); }

      const salt = await bcrypt.genSalt(10);
      const hashedPwd = await bcrypt.hash(password, salt);

      const globalRoomId = process.env.GLOBAL_CHANNEL_ID;
      let globalRoom;
      if (globalRoomId) {
        globalRoom = await db.room.findUnique({ where: { id: globalRoomId } });
      }
      const userData = globalRoomId && globalRoom
        ? { username, pwd_hash: hashedPwd, roomIDs: [globalRoomId] }
        : { username, pwd_hash: hashedPwd };

      const user = await db.user.create({
        data: userData
      });

      if (globalRoom) {
        const updatedRoom = await db.room.update({
          where: {
            id: globalRoomId
          },
          data: {
            memberIDs: [...globalRoom.memberIDs, user.id]
          }
        });
        io.to(globalRoom.id).emit("user-added", user.id, user.username, updatedRoom);
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { pwd_hash, ...userWithoutPwd } = user;

      return res.status(201).json(userWithoutPwd);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.user;

      const user = await db.user.findUnique({ where: { id }, include: { rooms: true } });
      if (!user) return res.status(400).json({ error: "User not found" });

      const promises = user.rooms.map(async room => {
        const newRoomMembers = room.memberIDs.filter(memberId => memberId !== user.id);
        io.to(room.id).emit("user-removed", id, room);
        return await db.room.update({ where: { id: room.id }, data: { memberIDs: newRoomMembers } });
      });

      await Promise.all(promises);

      const result = await db.user.delete({ where: { id } });

      res.clearCookie("jwt");
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new UserController();
