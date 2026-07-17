import { AIProvider } from "./aiProvider.interface.js";
import { GeminiProvider } from "./geminiProvider.js";
import { DeepSeekProvider } from "./deepseekProvider.js";
import { HuggingFaceProvider } from "./huggingfaceProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";

export type ProviderType = "gemini" | "deepseek" | "huggingface" | "openrouter";

export function getAIProvider(provider: ProviderType): AIProvider {
  switch (provider) {
    case "deepseek":
      return new DeepSeekProvider();
    case "huggingface":
      return new HuggingFaceProvider();
    case "openrouter":
      return new OpenRouterProvider();
    default:
      return new GeminiProvider();
  }
}
