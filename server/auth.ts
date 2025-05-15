
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
  user?: { id: number; username: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export async function login(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  return { token, user: { id: user.id, username: user.username } };
}
