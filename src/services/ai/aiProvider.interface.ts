export interface AIProvider {
  generateText(prompt: string, maxTokens: number): Promise<string>;
  streamChat(messages: { role: string; content: string }[]): AsyncGenerator<string>;
  analyzeImage(imageBase64: string, prompt?: string): Promise<string>;
}
