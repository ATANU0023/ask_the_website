import { QdrantClient } from "@qdrant/js-client-rest";

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    workspaceId: string;
    userId: string;
    documentId: string;
    chunkId: string;
    sourceType: string;
    pageNumber?: number;
    section?: string;
    content: string;
    chunkIndex: number;
  };
}

export interface SearchFilter {
  workspaceId?: string;
  documentId?: string;
  sourceType?: string;
}

interface SearchResult {
  id: string;
  score: number;
  payload: VectorPoint["payload"];
}

class QdrantVectorStore {
  private client: QdrantClient;
  private defaultCollections: Set<string> = new Set(["workspace_documents"]);

  constructor() {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;

    if (!url) throw new Error("QDRANT_URL environment variable is required");

    this.client = new QdrantClient({
      url,
      apiKey,
    });
  }

  private async ensureCollection(collection: string): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some((c) => c.name === collection);

    if (!exists) {
      await this.client.createCollection(collection, {
        vectors: { size: 1024, distance: "Cosine" },
      });
    }

    for (const field of ["documentId", "workspaceId", "userId", "sourceType"]) {
      try {
        await this.client.createPayloadIndex(collection, {
          field_name: field,
          field_schema: "keyword",
          wait: false,
        });
      } catch {
        // Index already exists
      }
    }
  }

  async upsertChunk(collection: string, point: VectorPoint): Promise<void> {
    await this.ensureCollection(collection);
    await this.client.upsert(collection, {
      wait: true,
      points: [
        {
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        },
      ],
    });
  }

  async upsertChunks(collection: string, points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    await this.ensureCollection(collection);
    await this.client.upsert(collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  async search(
    collection: string,
    queryVector: number[],
    filter?: SearchFilter,
    limit: number = 30
  ): Promise<SearchResult[]> {
    await this.ensureCollection(collection);

    const must: any[] = [];
    if (filter?.workspaceId) {
      must.push({
        key: "workspaceId",
        match: { value: filter.workspaceId },
      });
    }
    if (filter?.documentId) {
      must.push({
        key: "documentId",
        match: { value: filter.documentId },
      });
    }
    if (filter?.sourceType) {
      must.push({
        key: "sourceType",
        match: { value: filter.sourceType },
      });
    }

    const result = await this.client.search(collection, {
      vector: queryVector,
      limit,
      filter: must.length > 0 ? { must } : undefined,
      with_payload: true,
    });

    return result.map((r) => ({
      id: r.id as string,
      score: r.score ?? 0,
      payload: r.payload as VectorPoint["payload"],
    }));
  }

  async deleteByDocumentId(collection: string, documentId: string): Promise<void> {
    await this.ensureCollection(collection);
    await this.client.delete(collection, {
      wait: true,
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
    });
  }

  async deleteByWorkspaceId(collection: string, workspaceId: string): Promise<void> {
    await this.ensureCollection(collection);
    await this.client.delete(collection, {
      wait: true,
      filter: {
        must: [{ key: "workspaceId", match: { value: workspaceId } }],
      },
    });
  }
}

export const vectorStore = new QdrantVectorStore();
