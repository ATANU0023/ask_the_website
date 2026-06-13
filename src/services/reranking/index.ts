import { llm } from "@/services/llm";

interface ChunkItem {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

interface ScoredChunk extends ChunkItem {
  relevanceScore: number;
}

export async function rerank(
  query: string,
  chunks: ChunkItem[],
  topK: number = 5
): Promise<ChunkItem[]> {
  if (chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  const prompt = `Given the following query, rate the relevance of each chunk on a scale of 1-10 (10 being most relevant).

Query: "${query}"

Chunks:
${chunks
  .map(
    (c, i) => `
[${i}]
${c.content.substring(0, 500)}
`
  )
  .join("\n")}

Return ONLY a JSON array of objects with "index" (number) and "relevanceScore" (number 1-10). Example: [{"index": 0, "relevanceScore": 8}, {"index": 1, "relevanceScore": 3}]`;

  try {
    const response = await llm.generate(prompt);
    const scores: { index: number; relevanceScore: number }[] =
      JSON.parse(response);

    const scored = chunks.map((chunk, i) => {
      const found = scores.find((s) => s.index === i);
      return {
        ...chunk,
        relevanceScore: found?.relevanceScore ?? chunk.score,
      };
    });

    return scored
      .sort(
        (a: ScoredChunk, b: ScoredChunk) => b.relevanceScore - a.relevanceScore
      )
      .slice(0, topK);
  } catch {
    return chunks.slice(0, topK);
  }
}
