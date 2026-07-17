import { AIProvider } from "./aiProvider.interface.js";
import { GroqProvider } from "./groqProvider.js";
import { GeminiProvider } from "./geminiProvider.js";

export function getAIProvider(provider: "groq" | "gemini"): AIProvider {
  if (provider === "gemini") return new GeminiProvider();
  return new GroqProvider();
}
