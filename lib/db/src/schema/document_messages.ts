import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { documentsTable } from "./documents";

export const documentMessagesTable = pgTable("document_messages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentsTable.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentMessageSchema = createInsertSchema(documentMessagesTable).omit({ id: true, createdAt: true });
export type InsertDocumentMessage = z.infer<typeof insertDocumentMessageSchema>;
export type DocumentMessage = typeof documentMessagesTable.$inferSelect;
