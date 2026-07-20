import { Router, Response } from "express";
import { getAIProvider } from "../services/ai/aiProviderFactory.js";
import { generateContentSchema, chatSchema, analyzeImageSchema } from "../validators/ai.js";
import { protect, AuthRequest } from "../middleware/protect.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import ChatSession from "../models/ChatSession.js";
import GeneratedContent from "../models/GeneratedContent.js";
import ImageAnalysis from "../models/ImageAnalysis.js";

const router = Router();

const PROMPT_TEMPLATES: Record<string, string> = {
  blog: "Write a {tone} blog post about \"{topic}\". Length: {length} words. Use markdown formatting.",
  social: "Write a {tone} social media post about \"{topic}\". Length: {length} words. Use hashtags.",
  product: "Write a {tone} product description for \"{topic}\". Length: {length} words. Highlight features and benefits.",
  docs: "Write a {tone} documentation entry for \"{topic}\". Length: {length} words. Use markdown formatting with headings and code examples.",
};

const LENGTH_MAP: Record<string, number> = {
  short: 120,
  medium: 300,
  long: 600,
};

router.post(
  "/generate-content",
  protect,
  aiRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = generateContentSchema.parse(req.body);
      const ai = getAIProvider();

      const template = PROMPT_TEMPLATES[data.contentType];
      const maxTokens = LENGTH_MAP[data.length];
      const prompt = template
        .replace("{tone}", data.tone)
        .replace("{topic}", data.topic)
        .replace("{length}", String(maxTokens));

      const output = await ai.generateText(prompt, maxTokens);

      await GeneratedContent.create({
        userId: req.user!._id,
        prompt,
        output,
        contentType: data.contentType,
        provider: "openrouter",
      });

      res.json({ success: true, content: output, providerUsed: "openrouter" });
    } catch (err: any) {
      if (err.name === "ZodError") {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      console.error(err);
      res.status(500).json({ success: false, message: "AI generation failed" });
    }
  }
);

router.post(
  "/analyze-image",
  protect,
  aiRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = analyzeImageSchema.parse(req.body);
      const ai = getAIProvider();

      const analysis = await ai.analyzeImage(data.image, data.prompt);

      const record = await ImageAnalysis.create({
        userId: req.user!._id,
        imageData: data.image,
        imageName: data.imageName || "untitled",
        prompt: data.prompt || "",
        analysis,
      });

      res.json({ success: true, analysis: record });
    } catch (err: any) {
      if (err.name === "ZodError") {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Image analysis failed" });
    }
  }
);

router.get("/image-history", protect, async (req: AuthRequest, res: Response) => {
  try {
    const items = await ImageAnalysis.find({ userId: req.user!._id })
      .select("imageName prompt analysis createdAt")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

router.delete("/image-history/:id", protect, async (req: AuthRequest, res: Response) => {
  try {
    const item = await ImageAnalysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });
    if (!item) {
      res.status(404).json({ success: false, message: "Analysis not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
});

router.post(
  "/chat",
  protect,
  aiRateLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = chatSchema.parse(req.body);
      const ai = getAIProvider();

      let session = data.sessionId
        ? await ChatSession.findById(data.sessionId)
        : null;

      if (!session) {
        session = await ChatSession.create({
          userId: req.user!._id,
          agentType: "assistant",
          messages: [
            {
              role: "system",
              content:
                "You are MindAgent Assistant. First understand the user's intent. Ask a clarifying question if needed. Then provide a helpful answer. At the end, suggest 2-3 follow-up questions as a JSON array.",
              timestamp: new Date(),
            },
          ],
        });
      }

      session.messages.push({
        role: "user",
        content: data.message,
        timestamp: new Date(),
      });

      const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      let streamOk = false;

      try {
        const generator = ai.streamChat(history);
        for await (const chunk of generator) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        streamOk = true;
      } catch (streamErr) {
        console.error("AI stream error:", streamErr);
        res.write(`data: ${JSON.stringify({ text: "\n\nI'm sorry, I encountered an error. Please try again." })}\n\n`);
        res.end();
        return;
      }

      if (!fullResponse.trim()) {
        res.write(`data: ${JSON.stringify({ text: "\n\nNo response from AI provider." })}\n\n`);
        res.end();
        return;
      }

      const match = fullResponse.match(/\[.*\]/s);
      let suggestions: string[] = [];
      let cleanedResponse = fullResponse;
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
          cleanedResponse = fullResponse.replace(/\[.*\]/s, "").trim();
        } catch {}
      }

      session.messages.push({
        role: "assistant",
        content: cleanedResponse,
        timestamp: new Date(),
      });
      await session.save();

      res.write(`data: ${JSON.stringify({ sessionId: session._id, done: true, suggestions })}\n\n`);
      res.end();
    } catch (err: any) {
      if (err.name === "ZodError") {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Chat failed" });
    }
  }
);

router.get("/sessions", protect, async (req: AuthRequest, res: Response) => {
  const sessions = await ChatSession.find({ userId: req.user!._id })
    .sort({ "messages.timestamp": -1 })
    .limit(20);
  res.json({ success: true, sessions });
});

router.delete("/sessions/:id", protect, async (req: AuthRequest, res: Response) => {
  const session = await ChatSession.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });
  if (!session) {
    res.status(404).json({ success: false, message: "Session not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/history", protect, async (req: AuthRequest, res: Response) => {
  const items = await GeneratedContent.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, items });
});

router.delete("/history/:id", protect, async (req: AuthRequest, res: Response) => {
  const item = await GeneratedContent.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });
  if (!item) {
    res.status(404).json({ success: false, message: "Item not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
