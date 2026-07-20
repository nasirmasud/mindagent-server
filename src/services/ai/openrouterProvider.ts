import { AIProvider } from "./aiProvider.interface.js";

const OR_API = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  private getKey() { return process.env.OPENROUTER_API_KEY || ""; }

  async generateText(prompt: string, maxTokens: number) {
    const res = await fetch(OR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getKey()}`,
        "HTTP-Referer": "https://mindagent.ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter API ${res.status}: ${errBody}`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async analyzeImage(imageBase64: string, prompt?: string) {
    const userPrompt = prompt?.trim() || "Describe this image in detail. What objects, people, text, and scene do you see?";
    const res = await fetch(OR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getKey()}`,
        "HTTP-Referer": "https://mindagent.ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter vision API ${res.status}: ${errBody}`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const res = await fetch(OR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getKey()}`,
        "HTTP-Referer": "https://mindagent.ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter API ${res.status}: ${errBody}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
        try {
          const json = JSON.parse(line.slice(6));
          if (json.choices?.[0]?.delta?.content) {
            yield json.choices[0].delta.content;
          }
        } catch {}
      }
    }
  }
}
