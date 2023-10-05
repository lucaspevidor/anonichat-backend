import { type Request, type Response } from "express";
import bcrypt from "bcrypt";

import { db } from "../services/db";

interface IUserPOST {
  username: string
  password: string
}

class UserController {
  async create (req: Request<any, IUserPOST>, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    try {
      const userExists = await db.user.findFirst({ where: { username } });
      if (userExists) { return res.status(400).json({ error: "Username already exists" }); }

      const salt = await bcrypt.genSalt(10);
      const hashedPwd = await bcrypt.hash(password, salt);

      const user = await db.user.create({
        data: {
          username, pwd_hash: hashedPwd
        }
      });

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { pwd_hash, ...userWithoutPwd } = user;

      return res.status(201).json(userWithoutPwd);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new UserController();
