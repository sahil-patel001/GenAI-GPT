# ChaiGPT — AI Chat with Web Search & Conversation Branching

A ChatGPT-style AI chat application built on Next.js 16, extended with two
production-grade features:

- **Phase 1 — AI Tool Calling (Web Search):** the model autonomously searches
  the web (via Firecrawl) when a question needs up-to-date information, streams
  the tool execution live, and grounds its answer in the retrieved sources.
- **Phase 2 — Conversation Branching:** continue a conversation from any
  previous message in an independent branch — like git, but for chats.

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                      |
| AI         | Vercel AI SDK v7 (`streamText`, tool calling) + OpenAI  |
| Web Search | Firecrawl `/v2/search` (search + page scraping)         |
| Auth       | Clerk                                                   |
| Database   | PostgreSQL (Neon) + Prisma v7                           |
| UI         | React 19, Tailwind CSS v4, shadcn/ui, Streamdown        |
| State      | TanStack React Query                                    |

## Features

### 🔍 Web Search Tool Calling

- The LLM **decides on its own** when to invoke the `webSearch` tool
  (current events, versions, prices, anything past its training cutoff).
- Firecrawl searches the web **and scrapes each result's main content** as
  markdown, so answers are grounded in real page content, not just snippets.
- Multi-step streaming via `stopWhen: stepCountIs(5)` — the model can search,
  read, search again, then answer, all in one streamed response.
- Live UI states: an animated *"Searching the web for …"* card while the tool
  runs, a collapsible source list (favicons, titles, domains) when results
  arrive, and a dedicated error card if the search fails.
- **Persistence:** tool calls and results are stored in `Message.parts`
  (JSON) and rehydrate perfectly on reload.

### 🌿 Conversation Branching

- **Branch from any message** — hover a message and click the branch icon.
- The shared history up to the branch point is **copied into the new branch**,
  so every branch is fully self-contained and survives parent deletion.
- **Branch navigation:** a `Branches` dropdown in the header (parent, sibling
  branches, child branches), a *"Branched from …"* banner linking back to the
  parent, and **nested branch rows** in the sidebar with branch icons.
- **Rename / delete** branches from the sidebar (branches are first-class
  conversations).
- Schema: `Conversation.parentId` + `branchedFromMessageId` self-relation
  (`onDelete: SetNull`).

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/sahil-patel001/GenAI-GPT.git
cd GenAI-GPT
bun install   # or npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | Postgres connection string — free at [neon.tech](https://neon.tech) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | [Clerk dashboard](https://dashboard.clerk.com) → API Keys |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://www.firecrawl.dev) dashboard |

The two `NEXT_PUBLIC_CLERK_SIGN_IN_*` values are pre-filled in
`.env.example`.

### 3. Set up the database

```bash
bunx prisma migrate dev
```

### 4. Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and chat.

## Project Structure

```
app/
  api/chat/route.ts        # Streaming chat endpoint (tools + persistence)
  (root)/c/[id]/page.tsx   # Conversation page
features/
  ai/
    tools/firecrawl.ts     # Firecrawl search client (fetch, timeout, errors)
    tools/web-search.ts    # webSearch tool definition + typed ChatUIMessage
    actions/chat-store.ts  # Message load/save (UIMessage <-> Prisma)
    utils/model.ts         # Model selection
  conversation/
    actions/               # Conversation + branch server actions
    hooks/                 # React Query hooks (conversations, branching)
    components/            # Chat view, messages, branch switcher, sidebar
prisma/schema.prisma       # User / Conversation (self-relation) / Message
```

## How Branching Works

```
Parent:  U1 ─ A1 ─ U2 ─ A2 ─ U3 ─ A3
                      │
Branch:  U1 ─ A1 ─ U2 ─ A2 ─ U4' ─ A4'   (copied up to A2, then diverges)
```

Branching a conversation at message *A2* creates a new `Conversation` with
`parentId` and `branchedFromMessageId` set, and copies messages `U1…A2` into
it (fresh IDs, original timestamps). Both chats then evolve independently,
while the UI uses the `parentId` links to render the branch tree, the header
switcher, and the "Branched from" banner.

## Error Handling

- Tool failures surface as `output-error` parts → rendered as an inline error
  card; the model still completes its answer gracefully.
- Server actions validate Clerk auth + resource ownership on every call.
- React Query mutations show toast feedback for create/rename/delete/branch.

---

Built for the GenAI-JS 2026 assignment on top of the
[chai-gpt-build](https://github.com/Aestheticsuraj234/chai-gpt-build) starter.
