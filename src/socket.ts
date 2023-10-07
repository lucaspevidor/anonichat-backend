import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log(`The socket ${socket.id} has connected`);

  socket.on("disconnect", (reason) => {
    console.log(`The socket ${socket.id} has been disconnected because ${reason}`);
  });
});

export { io, server };
