import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback-secret";

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string } {
  return jwt.verify(token, SECRET) as { id: string };
}
