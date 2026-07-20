import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { registerSchema, loginSchema, googleSchema } from "../validators/auth.js";
import { protect, AuthRequest } from "../middleware/protect.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authRateLimiter);

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      res.status(400).json({ success: false, message: "Email already in use" });
      return;
    }
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: hashed,
      authProvider: "email",
      ...(data.avatar ? { avatar: data.avatar } : {}),
    });
    const token = signToken(user._id.toString());
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user || !user.password) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/demo-login", async (_req: Request, res: Response) => {
  try {
    let user = await User.findOne({ email: "demo@mindagent.ai" });
    if (!user) {
      user = await User.create({
        name: "Demo User",
        email: "demo@mindagent.ai",
        authProvider: "email",
      });
    }
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/google", async (req: Request, res: Response) => {
  try {
    const data = googleSchema.parse(req.body);
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        googleId: data.googleId,
        avatar: data.avatar,
        authProvider: "google",
      });
    }
    const token = signToken(user._id.toString());
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/me", protect, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

export default router;
