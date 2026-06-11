import type { LLMProvider } from "../types";

export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY or GROQ_KEY environment variable is required");
    this.apiKey = apiKey;

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    this.model = model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content || "";
  }

  async generateStream(
    prompt: string,
    systemPrompt?: string
  ): Promise<ReadableStream<string>> {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error: ${res.status} ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body from Groq");

    const decoder = new TextDecoder();

    const stream = new ReadableStream<string>({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) controller.enqueue(content);
              } catch {
                // skip malformed JSON
              }
            }
          }
        } catch (error) {
          // stream ended
        } finally {
          controller.close();
        }
      },
    });

    return stream;
  }
}
