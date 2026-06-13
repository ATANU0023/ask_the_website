export interface ChunkMetadata {
  index: number;
  pageNumber?: number;
  section?: string;
}

export interface ChunkResult {
  chunks: string[];
  metadata: ChunkMetadata[];
}

interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

function splitByDelimiters(text: string, delimiters: string[]): string[] {
  let splits: string[] = [text];
  for (const delimiter of delimiters) {
    const next: string[] = [];
    for (const s of splits) {
      const parts = s.split(delimiter);
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed) next.push(trimmed);
      }
    }
    splits = next.length > 0 ? next : splits;
  }
  return splits;
}

export function recursiveChunk(text: string, options?: ChunkOptions): ChunkResult {
  const chunkSize = options?.chunkSize ?? 1000;
  const overlap = options?.overlap ?? 200;
  const stride = chunkSize - overlap;

  const sentences = splitByDelimiters(text, ["\n\n", "\n", ". ", "! ", "? "]);

  const chunks: string[] = [];
  const metadata: ChunkMetadata[] = [];
  let current: string[] = [];
  let currentLen = 0;
  let index = 0;

  for (const sentence of sentences) {
    if (currentLen + sentence.length > chunkSize && current.length > 0) {
      const content = current.join(" ");
      chunks.push(content);
      metadata.push({ index });

      const overlapText: string[] = [];
      let overlapLen = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        if (overlapLen + current[i].length > overlap) break;
        overlapText.unshift(current[i]);
        overlapLen += current[i].length;
      }
      current = [...overlapText];
      currentLen = overlapLen;
      index++;
    }
    current.push(sentence);
    currentLen += sentence.length;
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
    metadata.push({ index });
  }

  return { chunks, metadata };
}

export function semanticChunk(text: string): ChunkResult {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  const metadata: ChunkMetadata[] = [];
  let index = 0;
  let buffer: string[] = [];
  let bufferLen = 0;
  const targetSize = 1000;

  for (const para of paragraphs) {
    if (bufferLen + para.length > targetSize && buffer.length > 0) {
      chunks.push(buffer.join("\n\n"));
      metadata.push({ index });
      buffer = [];
      bufferLen = 0;
      index++;
    }
    buffer.push(para);
    bufferLen += para.length;
  }

  if (buffer.length > 0) {
    chunks.push(buffer.join("\n\n"));
    metadata.push({ index });
  }

  return { chunks, metadata };
}

export function chunkDocument(
  text: string,
  strategy: "recursive" | "semantic" = "recursive"
): ChunkResult {
  if (strategy === "semantic") return semanticChunk(text);
  return recursiveChunk(text);
}
