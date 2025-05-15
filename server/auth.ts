
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
  console.log(`Login attempt for user: ${username}`);
  
  const user = await storage.getUserByUsername(username);
  if (!user) {
    console.log('User not found in database');
    throw new Error("User not found");
  }
  
  console.log('User found, comparing passwords');
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    console.log('Password comparison failed');
    throw new Error("Invalid password");
  }
  
  console.log('Password valid, generating token');
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  console.log('Login successful');
  return { token, user: { id: user.id, username: user.username } };
}
