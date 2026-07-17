import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./aiProvider.interface.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiProvider implements AIProvider {
  async generateText(prompt: string, maxTokens: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });
    return result.response.text();
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const result = await model.generateContentStream({ contents });
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
}
