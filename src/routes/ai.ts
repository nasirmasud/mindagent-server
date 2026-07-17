import { Router, Response } from "express";
import { getAIProvider } from "../services/ai/aiProviderFactory.js";
import { generateContentSchema, chatSchema } from "../validators/ai.js";
import { protect, AuthRequest } from "../middleware/protect.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import ChatSession from "../models/ChatSession.js";
import GeneratedContent from "../models/GeneratedContent.js";

const router = Router();

const PROMPT_TEMPLATES: Record<string, string> = {
  blog: "Write a {tone} blog post about \"{topic}\". Length: {length} words. Use markdown formatting.",
  social: "Write a {tone} social media post about \"{topic}\". Length: {length} words. Use hashtags.",
  product: "Write a {tone} product description for \"{topic}\". Length: {length} words. Highlight features and benefits.",
};

const LENGTH_MAP: Record<string, number> = {
  short: 150,
  medium: 400,
  long: 800,
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

      session.messages.push({
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      });
      await session.save();

      const match = fullResponse.match(/\[.*\]/s);
      let suggestions: string[] = [];
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch {}
      }

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

export default router;
