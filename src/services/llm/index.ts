import type { LLMProvider, ProviderType } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";

const PROVIDER_MAP: Record<ProviderType, () => LLMProvider> = {
  gemini: () => new GeminiProvider(),
  groq: () => new GroqProvider(),
};

function getDefaultProvider(): ProviderType {
  const env = process.env.LLM_PROVIDER;
  if (env === "groq" || env === "gemini") return env;
  return "gemini";
}

class LLMService {
  private defaultType: ProviderType;
  private cache = new Map<ProviderType, LLMProvider>();

  constructor() {
    this.defaultType = getDefaultProvider();
  }

  private getProvider(type?: ProviderType): LLMProvider {
    const resolved = type || this.defaultType;
    let provider = this.cache.get(resolved);
    if (!provider) {
      const factory = PROVIDER_MAP[resolved];
      if (!factory) throw new Error(`Unknown LLM provider: ${resolved}`);
      provider = factory();
      this.cache.set(resolved, provider);
    }
    return provider;
  }

  async generate(prompt: string, systemPrompt?: string, provider?: ProviderType): Promise<string> {
    return this.getProvider(provider).generate(prompt, systemPrompt);
  }

  async generateStream(prompt: string, systemPrompt?: string, provider?: ProviderType): Promise<ReadableStream<string>> {
    return this.getProvider(provider).generateStream(prompt, systemPrompt);
  }
}

export const llm = new LLMService();
export type { ProviderType } from "./types";
