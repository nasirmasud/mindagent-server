import { Router, Response } from "express";
import Item from "../models/Item.js";
import { protect, AuthRequest } from "../middleware/protect.js";

const router = Router();

router.get("/", async (_req, res: Response) => {
  const items = await Item.find().populate("ownerId", "name email");
  res.json({ success: true, items });
});

router.get("/my", protect, async (req: AuthRequest, res: Response) => {
  const items = await Item.find({ ownerId: req.user!._id });
  res.json({ success: true, items });
});

router.post("/", protect, async (req: AuthRequest, res: Response) => {
  const item = await Item.create({ ...req.body, ownerId: req.user!._id });
  res.status(201).json({ success: true, item });
});

router.put("/:id", protect, async (req: AuthRequest, res: Response) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user!._id },
    req.body,
    { new: true }
  );
  if (!item) {
    res.status(404).json({ success: false, message: "Item not found" });
    return;
  }
  res.json({ success: true, item });
});

router.delete("/:id", protect, async (req: AuthRequest, res: Response) => {
  const item = await Item.findOneAndDelete({
    _id: req.params.id,
    ownerId: req.user!._id,
  });
  if (!item) {
    res.status(404).json({ success: false, message: "Item not found" });
    return;
  }
  res.json({ success: true, message: "Deleted" });
});

export default router;
