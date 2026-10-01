import { Router, Response } from "express";
import User from "../models/User.js";
import { protect, AuthRequest, requireAdmin } from "../middleware/protect.js";

const router = Router();

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const DEMO_EMAIL = "demo@mindagent.ai";

// `protect` reads the user fresh from the database on every request, so the role
// checked here cannot be stale from an older token that predates a promotion.
router.get("/stats", protect, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const since = new Date(Date.now() - WEEK_MS);

    const [totalUsers, emailUsers, googleUsers, admins, demoUsers, newThisWeek] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ authProvider: "email" }),
        User.countDocuments({ authProvider: "google" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ email: DEMO_EMAIL }),
        User.countDocuments({ createdAt: { $gte: since } }),
      ]);

    res.json({
      success: true,
      stats: { totalUsers, emailUsers, googleUsers, admins, demoUsers, newThisWeek },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;