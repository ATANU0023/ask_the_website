import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { LLMProvider } from "../types";

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string = "gemini-2.5-flash";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: systemPrompt
        ? { role: "user", parts: [{ text: systemPrompt }] }
        : undefined,
    });

    const response = result.response;
    return response.text();
  }

  async generateStream(
    prompt: string,
    systemPrompt?: string
  ): Promise<ReadableStream<string>> {
    const result = await this.model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: systemPrompt
        ? { role: "user", parts: [{ text: systemPrompt }] }
        : undefined,
    });

    const stream = new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(text);
        }
        controller.close();
      },
    });

    return stream;
  }
}
