# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.4, streaming SSE)

## Application: Company Q&A Chatbot

An AI-powered chatbot that answers questions strictly based on uploaded company documents (SOPs, FAQs, policies, etc.). Prevents hallucination by restricting answers to document content only.

### Features
- Upload company documents (name + text content)
- Ask questions and receive streaming AI answers in real time
- Context-aware multi-turn conversation history per document
- Strict anti-hallucination prompting — returns "Information not available" when answer is not in the document
- Clear chat history per document
- Delete documents

### Architecture
- **Frontend**: React + Vite (`artifacts/chatbot`) at `/`
- **Backend**: Express 5 (`artifacts/api-server`) at `/api`
- **AI**: OpenAI gpt-5.4 via Replit AI Integrations (no user API key needed)
- **DB Tables**: `documents`, `document_messages`

### Key API Endpoints
- `GET /api/documents` — list documents
- `POST /api/documents` — upload a document
- `DELETE /api/documents/:id` — delete a document
- `POST /api/documents/:id/ask` — ask a question (SSE streaming)
- `GET /api/documents/:id/messages` — get Q&A history
- `DELETE /api/documents/:id/messages/clear` — clear history

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
