import { AIProvider } from "./aiProvider.interface.js";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export class OllamaProvider implements AIProvider {
  async generateText(prompt: string, maxTokens: number) {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        options: { num_predict: maxTokens },
      }),
    });
    const data: any = await res.json();
    return data.response || "";
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: true,
      }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n").filter(Boolean)) {
        try {
          const json = JSON.parse(line);
          if (json.response) yield json.response;
        } catch {}
      }
    }
  }
}
