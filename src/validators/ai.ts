import { z } from "zod";

export const generateContentSchema = z.object({
  topic: z.string().min(1).max(500),
  contentType: z.enum(["blog", "social", "product", "docs"]),
  tone: z.enum(["professional", "friendly", "persuasive", "witty"]),
  length: z.enum(["short", "medium", "long"]),
});

export const analyzeImageSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  imageName: z.string().optional(),
  prompt: z.string().max(1000).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().nullable().optional(),
});
