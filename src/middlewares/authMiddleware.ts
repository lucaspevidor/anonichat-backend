import jwt from "jsonwebtoken";
import { type NextFunction, type Request, type Response } from "express";
import { type ITokenPayload, auth } from "../lib/token";

declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string
      username: string
    }
  }
}

export default async function Auth (req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt;

  if (!token) { return res.status(401).json({ error: "Unauthorized" }); };

  try {
    const decoded = jwt.verify(token, auth.secret) as ITokenPayload;

    const { user } = decoded;

    req.user = user;
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
