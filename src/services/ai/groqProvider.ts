import Groq from "groq-sdk";
import { AIProvider } from "./aiProvider.interface.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class GroqProvider implements AIProvider {
  async generateText(prompt: string, maxTokens: number) {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    return res.choices[0].message.content ?? "";
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any,
      stream: true,
    });
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || "";
    }
  }
}
