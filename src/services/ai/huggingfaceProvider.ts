import { AIProvider } from "./aiProvider.interface.js";

const HF_API = "https://api-inference.huggingface.co/models";
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || "";

export class HuggingFaceProvider implements AIProvider {
  private async request(prompt: string, maxTokens: number): Promise<string> {
    const res = await fetch(`${HF_API}/mistralai/Mistral-7B-Instruct-v0.3`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: maxTokens },
      }),
    });
    const data: any = await res.json();
    if (Array.isArray(data)) return data[0]?.generated_text || "";
    return data.generated_text || "";
  }

  async generateText(prompt: string, maxTokens: number) {
    return this.request(prompt, maxTokens);
  }

  async *streamChat(messages: { role: string; content: string }[]) {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const text = await this.request(prompt, 500);
    yield text;
  }
}
