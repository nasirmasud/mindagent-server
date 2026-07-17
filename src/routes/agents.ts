import { Router, Request, Response } from "express";
import Agent from "../models/Agent.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const agents = await Agent.find();
  res.json({ success: true, agents });
});

router.get("/:id", async (req: Request, res: Response) => {
  const agent = await Agent.findById(req.params.id);
  if (!agent) {
    res.status(404).json({ success: false, message: "Agent not found" });
    return;
  }
  res.json({ success: true, agent });
});

export default router;
