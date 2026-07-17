import { AIProvider } from "./aiProvider.interface.js";
import { GeminiProvider } from "./geminiProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";
import { HuggingFaceProvider } from "./huggingfaceProvider.js";
import { OpenRouterProvider } from "./openrouterProvider.js";

export type ProviderType = "gemini" | "ollama" | "huggingface" | "openrouter";

export function getAIProvider(provider: ProviderType): AIProvider {
  switch (provider) {
    case "ollama":
      return new OllamaProvider();
    case "huggingface":
      return new HuggingFaceProvider();
    case "openrouter":
      return new OpenRouterProvider();
    default:
      return new GeminiProvider();
  }
}
