import { z } from "zod";

export const generateContentSchema = z.object({
  topic: z.string().min(1).max(500),
  contentType: z.enum(["blog", "social", "product"]),
  tone: z.enum(["formal", "casual", "persuasive"]),
  length: z.enum(["short", "medium", "long"]),
  provider: z.enum(["gemini", "deepseek", "huggingface", "openrouter"]).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  provider: z.enum(["gemini", "deepseek", "huggingface", "openrouter"]).optional(),
});
