import { type Socket } from "socket.io";
import { type DefaultEventsMap } from "socket.io/dist/typed-events";
import jwt from "jsonwebtoken";
import { type ITokenPayload, auth } from "../lib/token";
import { db } from "../services/db";

export async function OnBegin(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  id: string,
  token: string
) {
  try {
    const decoded = jwt.verify(token, auth.secret) as ITokenPayload;
    if (decoded.user.id === id) {
      await socket.join(id);
      console.log("Socket has joined");
    } else {
      socket.emit("error", "Invalid token");
      console.log("Invalid token");
    }

    await SubToRooms(socket, id);
  } catch (error) {
    socket.emit("error", "Invalid token");
    console.log("Invalid token");
  }
}

async function SubToRooms(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  id: string
) {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      console.error("[SubToRooms] User not found on DB");
      socket.emit("error", "Internal server error");
      return;
    }

    user.roomIDs.forEach(rId => {
      socket.join(rId)?.catch(error => { throw new Error(error); });
    });
    console.log(`User ${id} is subbed to rooms`);
  } catch (error) {
    socket.emit("error", "Internal server error");
    console.log("[SubToRooms] Internal Server Error", error);
  }
}
