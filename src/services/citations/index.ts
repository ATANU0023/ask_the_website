export interface Citation {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  pageNumber?: number;
  section?: string;
  textSnippet: string;
}

interface GroupedCitations {
  [sourceId: string]: {
    sourceTitle: string;
    sourceType: string;
    citations: Citation[];
  };
}

export function formatCitations(citations: Citation[]): GroupedCitations {
  const grouped: GroupedCitations = {};

  for (const citation of citations) {
    if (!grouped[citation.sourceId]) {
      grouped[citation.sourceId] = {
        sourceTitle: citation.sourceTitle,
        sourceType: citation.sourceType,
        citations: [],
      };
    }
    grouped[citation.sourceId].citations.push(citation);
  }

  return grouped;
}

interface ChunkWithCitation {
  content: string;
  citationIndex: number;
  metadata: {
    documentId: string;
    documentTitle: string;
    sourceType: string;
    pageNumber?: number;
    section?: string;
  };
}

export function buildContextWithCitations(
  chunks: ChunkWithCitation[]
): { context: string; citations: Citation[] } {
  const citations: Citation[] = [];
  const parts: string[] = [];

  for (const chunk of chunks) {
    const citationIndex = citations.length;
    citations.push({
      sourceId: chunk.metadata.documentId,
      sourceTitle: chunk.metadata.documentTitle,
      sourceType: chunk.metadata.sourceType,
      pageNumber: chunk.metadata.pageNumber,
      section: chunk.metadata.section,
      textSnippet: chunk.content.substring(0, 200),
    });

    parts.push(
      `[citation:${citationIndex}] ${chunk.content}`
    );
  }

  return {
    context: parts.join("\n\n"),
    citations,
  };
}
