import express from "express";
import * as C from "./controllers";

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.json("Hello!"));

app.post("/user", C.UserController.create);
app.post("/session", C.SessionController.create);

export default app;
