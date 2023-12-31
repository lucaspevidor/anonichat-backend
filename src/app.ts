import express from "express";
import cookieParser from "cookie-parser";

import * as C from "./controllers";
import Auth from "./middlewares/authMiddleware";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "https://anonichat.lucaspevidor.com",
  credentials: true,
}));

app.post("/user", C.UserController.create);
app.post("/session", C.SessionController.create);

app.use(Auth);

app.delete("/user", C.UserController.delete);

app.get("/load", C.RoomController.load);

app.get("/room/:roomId", C.RoomController.read);
app.get("/room/list", C.RoomController.index);
app.post("/room/:name", C.RoomController.create);
app.put("/room/:roomId", C.RoomController.update);
app.put("/room/add-user/:roomId/:username", C.RoomController.addUser);
app.put("/room/remove-user/:roomId/:userId", C.RoomController.removeUser);
app.delete("/room/:roomId", C.RoomController.delete);

app.get("/messages/:roomId", C.MessageController.index);
app.post("/messages/:roomId", C.MessageController.create);

export default app;
