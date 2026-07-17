import { Router, Response } from "express";
import { protect, AuthRequest } from "../middleware/protect.js";
import GeneratedContent from "../models/GeneratedContent.js";
import Agent from "../models/Agent.js";

const router = Router();

router.get("/", protect, async (req: AuthRequest, res: Response) => {
  try {
    const usage = await GeneratedContent.aggregate([
      { $match: { userId: req.user!._id } },
      { $group: { _id: "$contentType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    const topCategories = usage.map((u) => u._id);

    const recommendations = await Agent.find(
      topCategories.length > 0
        ? { category: { $in: topCategories } }
        : {}
    ).limit(6);

    res.json({ success: true, recommendations, usage });
  } catch {
    res.status(500).json({ success: false, message: "Failed to get recommendations" });
  }
});

export default router;
