export interface AIProvider {
  generateText(prompt: string, maxTokens: number): Promise<string>;
  streamChat(messages: { role: string; content: string }[]): AsyncGenerator<string>;
}
