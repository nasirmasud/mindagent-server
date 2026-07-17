import { Router, Request, Response } from "express";
import { contactSchema } from "../validators/contact.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = contactSchema.parse(req.body);
    console.log("Contact form submission:", { name: data.name, email: data.email, message: data.message.slice(0, 50) + "..." });
    res.json({ success: true, message: "Message received. We'll get back to you soon." });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
