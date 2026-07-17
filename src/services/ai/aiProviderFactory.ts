import { AIProvider } from "./aiProvider.interface.js";
import { OpenRouterProvider } from "./openrouterProvider.js";

export function getAIProvider(): AIProvider {
  return new OpenRouterProvider();
}
