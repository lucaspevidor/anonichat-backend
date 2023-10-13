import { type Request, type Response } from "express";
import { db } from "../services/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "../lib/token";

interface ISessionCreateReq {
  username: string
  password: string
}

class SessionController {
  async create(req: Request<any, ISessionCreateReq>, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) { return res.status(400).json({ error: "Missing username or password" }); }

    try {
      const user = await db.user.findFirst({
        where: { username }
      });
      if (!user) { return res.status(404).json({ error: "User not found" }); }

      const validPwd = await bcrypt.compare(password, user.pwd_hash);
      if (!validPwd) { return res.status(401).json({ error: "Invalid credentials" }); }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { pwd_hash, ...userWithoutPwd } = user;
      const token = jwt.sign({ user: userWithoutPwd }, auth.secret, auth.options);

      res.cookie("jwt", token, { maxAge: 604800000, sameSite: "lax" });
      res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");

      return res.json({ user: userWithoutPwd, token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new SessionController();
