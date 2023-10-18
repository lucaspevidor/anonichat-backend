import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app";
import { OnBegin } from "./controllers/socket-controller";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "anonichat.lucaspevidor.com"
  }
});

io.on("connection", (socket) => {
  console.log(`The socket ${socket.id} has connected`);

  socket.on("begin", (id, token) => {
    if (typeof id === "string" && typeof token === "string") {
      OnBegin(socket, id, token);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`The socket ${socket.id} has been disconnected because ${reason}`);
  });
});

export { io, server };
