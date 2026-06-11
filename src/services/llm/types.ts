export interface LLMProvider {
  generate(prompt: string, systemPrompt?: string): Promise<string>;
  generateStream(prompt: string, systemPrompt?: string): Promise<ReadableStream<string>>;
}

export type ProviderType = "gemini" | "groq";
