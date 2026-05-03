import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable, documentMessagesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .orderBy(documentsTable.createdAt);
  res.json(docs);
});

router.post("/documents", async (req, res): Promise<void> => {
  const { name, content } = req.body;
  if (!name || content == null || typeof content !== "string") {
    res.status(400).json({ error: "name and content are required" });
    return;
  }
  if (content.trim().length === 0) {
    res.status(400).json({ error: "content cannot be empty" });
    return;
  }

  const [doc] = await db.insert(documentsTable).values({ name, content }).returning();
  res.status(201).json(doc);
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(doc);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, id)).returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/documents/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const messages = await db
    .select()
    .from(documentMessagesTable)
    .where(eq(documentMessagesTable.documentId, id))
    .orderBy(documentMessagesTable.createdAt);

  res.json(messages);
});

router.delete("/documents/:id/messages/clear", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  await db.delete(documentMessagesTable).where(eq(documentMessagesTable.documentId, id));
  res.sendStatus(204);
});

router.post("/documents/:id/ask", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const { question } = req.body;
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  // Get prior conversation history for this document
  const history = await db
    .select()
    .from(documentMessagesTable)
    .where(eq(documentMessagesTable.documentId, id))
    .orderBy(documentMessagesTable.createdAt);

  // Save user question
  await db.insert(documentMessagesTable).values({
    documentId: id,
    role: "user",
    content: question,
  });

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const SYSTEM_PROMPT = `You are a company knowledge assistant. Your ONLY job is to answer questions using the information provided in the company document below.

STRICT RULES:
1. Answer ONLY based on the document content provided. Do not use any external knowledge.
2. If the answer cannot be found in the document, respond with exactly: "Information not available"
3. Be concise and accurate.
4. Do not make up, infer, or hallucinate information beyond what is explicitly stated in the document.
5. If only partial information is available, share what is available and note what is missing.

COMPANY DOCUMENT:
---
${doc.content}
---

Remember: Answer strictly from the document above. If the information is not in the document, say "Information not available".`;

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant response
    await db.insert(documentMessagesTable).values({
      documentId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get AI response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
