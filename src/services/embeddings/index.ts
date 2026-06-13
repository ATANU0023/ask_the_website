interface EmbeddingsProvider {
  generate(text: string): Promise<number[]>;
  generateBatch(texts: string[]): Promise<number[][]>;
}

class JinaEmbeddings implements EmbeddingsProvider {
  private apiKey: string;
  private model: string = "jina-embeddings-v3";
  private baseUrl: string = "https://api.jina.ai/v1/embeddings";

  constructor() {
    const key = process.env.JINA_API_KEY;
    if (!key) throw new Error("JINA_API_KEY environment variable is required");
    this.apiKey = key;
  }

  async generate(text: string): Promise<number[]> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Jina embedding failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.data[0].embedding as number[];
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Jina batch embedding failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.data
      .sort((a: any, b: any) => a.index - b.index)
      .map((item: any) => item.embedding as number[]);
  }
}

export const embeddingsProvider: EmbeddingsProvider = new JinaEmbeddings();
