import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const router = Router();

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

// base64 expands binary by ~4/3, plus the data-URL header the client may send.
const MAX_B64_CHARS = Math.ceil(MAX_BYTES * 1.4);

const avatarSchema = z.object({
  image: z.string().min(32).max(MAX_B64_CHARS),
  mimeType: z.enum(ALLOWED_MIME),
});

// Registration uploads an avatar before the user has a token, so this cannot be
// behind `protect`. That makes it the only unauthenticated write path in the API
// and an abuse vector, hence the dedicated limiter and the content sniffing below.
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many uploads, try again later" },
});

function sniff(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "GIF87a") {
    return "image/gif";
  }
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

router.post("/avatar", uploadRateLimiter, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.IMAGEBB_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, message: "Image upload not configured" });
      return;
    }

    const { image, mimeType } = avatarSchema.parse(req.body);

    const decoded = Buffer.from(image, "base64");
    if (decoded.length === 0) {
      res.status(400).json({ success: false, message: "Image data could not be decoded" });
      return;
    }
    if (decoded.length > MAX_BYTES) {
      res.status(413).json({ success: false, message: "Image is too large (max 2MB)" });
      return;
    }

    // Never trust the declared type - a caller could otherwise upload HTML or an
    // executable to a public CDN and have it served back under an image URL.
    const actual = sniff(decoded);
    if (!actual) {
      res.status(400).json({ success: false, message: "File content is not a supported image" });
      return;
    }
    if (actual !== mimeType) {
      res.status(400).json({
        success: false,
        message: `Declared type ${mimeType} does not match file content (${actual})`,
      });
      return;
    }

    const upstream = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: new URLSearchParams({ image: image }),
    });
    const result: any = await upstream.json().catch(() => ({}));

    if (!upstream.ok || !result?.success) {
      console.error("ImageBB upload failed:", result?.error?.message || upstream.status);
      res.status(502).json({ success: false, message: "Image upload failed" });
      return;
    }

    res.json({ success: true, url: result.data.url });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ success: false, errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
