import { AIProvider } from "./aiProvider.interface.js";

const DS_API = "https://api.deepseek.com/chat/completions";
const DS_KEY = process.env.DEEPSEEK_API_KEY || "";

export class DeepSeekProvider implements AIProvider {
  async generateText(prompt: string, maxTokens: number) {
    const res = await fetch(DS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DS_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const res = await fetch(DS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DS_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
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
      for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          if (json.choices?.[0]?.delta?.content) {
            yield json.choices[0].delta.content;
          }
        } catch {}
      }
    }
  }
}
