import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import User, { IUser } from "../models/User.js";

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function protect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}
