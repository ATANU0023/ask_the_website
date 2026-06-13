import crypto from "node:crypto";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chunkDocument } from "@/services/chunking";
import { embeddingsProvider } from "@/services/embeddings";
import { vectorStore } from "@/services/vector-store";

function parseXML(xmlString: string): string[] {
  const texts: string[] = [];
  const textRegex = /<a:t>([^<]*)<\/a:t>/g;
  let match;
  while ((match = textRegex.exec(xmlString)) !== null) {
    texts.push(match[1]);
  }
  return texts;
}

export async function extractText(buffer: Buffer): Promise<{
  text: string;
  slideCount: number;
  notes: string;
}> {
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles: string[] = [];
  zip.forEach((relPath, _entry) => {
    if (relPath.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      slideFiles.push(relPath);
    }
  });
  slideFiles.sort();

  const allTexts: string[] = [];
  const allNotes: string[] = [];

  for (const slideFile of slideFiles) {
    const file = zip.file(slideFile);
    if (!file) continue;

    const xmlContent = await file.async("text");
    const slideTexts = parseXML(xmlContent);
    allTexts.push(slideTexts.join(" "));

    const notesFile = slideFile.replace(/slide(\d+)\.xml$/, "notesSlide$1.xml");
    const notesEntry = zip.file(notesFile.replace("ppt/slides/", "ppt/notesSlides/"));
    if (notesEntry) {
      const notesXml = await notesEntry.async("text");
      const notesTexts = parseXML(notesXml);
      if (notesTexts.length > 0) {
        allNotes.push(`Slide ${slideFiles.indexOf(slideFile) + 1} notes: ${notesTexts.join(" ")}`);
      }
    }
  }

  return {
    text: allTexts.join("\n\n"),
    slideCount: slideFiles.length,
    notes: allNotes.join("\n"),
  };
}

export async function ingestPPTX(
  fileBuffer: Buffer,
  filename: string,
  workspaceId: string,
  userId: string,
  fileKey?: string
): Promise<{ documentId: string; chunks: number }> {
  const { text, slideCount, notes } = await extractText(fileBuffer);

  const fullText = notes ? `${text}\n\n${notes}` : text;

  const { chunks, metadata: chunkMeta } = chunkDocument(fullText, "recursive");

  const [doc] = await db
    .insert(documents)
    .values({
      workspaceId,
      userId,
      title: filename.replace(/\.pptx$/i, ""),
      sourceType: "pptx",
      fileKey: fileKey || filename,
      fileSize: fileBuffer.length,
      fileType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      pageCount: slideCount,
      status: "processing",
      totalChunks: chunks.length,
    })
    .returning();

  const embeddingBatch = await embeddingsProvider.generateBatch(chunks);

  const points = embeddingBatch.map((vector, i) => ({
    id: crypto.randomUUID(),
    vector,
    payload: {
      workspaceId,
      userId,
      documentId: doc.id,
      chunkId: chunkMeta[i]?.index.toString() ?? i.toString(),
      sourceType: "pptx",
      pageNumber: chunkMeta[i]?.pageNumber,
      section: chunkMeta[i]?.section ?? `Slide ${Math.floor(i * (chunks.length / slideCount)) + 1}`,
      content: chunks[i],
      chunkIndex: i,
    },
  }));

  await vectorStore.upsertChunks("workspace_documents", points);

  await db.insert(documentChunks).values(
    chunks.map((content, i) => ({
      documentId: doc.id,
      workspaceId,
      userId,
      chunkIndex: i,
      content,
      pageNumber: chunkMeta[i]?.pageNumber,
      section: chunkMeta[i]?.section,
      tokenCount: Math.ceil(content.length / 4),
    }))
  );

  await db
    .update(documents)
    .set({ status: "processed" })
    .where(eq(documents.id, doc.id));

  return { documentId: doc.id, chunks: chunks.length };
}
