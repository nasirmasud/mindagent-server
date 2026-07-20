import jwt from "jsonwebtoken";

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as { id: string };
}
