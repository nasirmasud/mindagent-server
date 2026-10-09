import { Router, Request, Response } from "express";
import Subscriber from "../models/Subscriber.js";
import { subscribeSchema } from "../validators/newsletter.js";
import { newsletterRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Persists the address so the confirmation below reflects a real signup. Duplicate
// submissions answer 200 too: telling a stranger whether an address is already
// subscribed turns this into an account-enumeration oracle.
router.post("/", newsletterRateLimiter, async (req: Request, res: Response) => {
  try {
    const data = subscribeSchema.parse(req.body);

    try {
      await Subscriber.create({ email: data.email });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }

    res.status(201).json({
      success: true,
      message: "You're subscribed - welcome aboard!",
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      res.status(400).json({ success: false, message: "Enter a valid email address" });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;