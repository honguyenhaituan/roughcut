# Article Studio

Turn rough "word vomit" travel notes (`.docx` / `.txt` / `.md`) into a structured, **source-attributed** magazine article you can review, edit, and export.

Built for the Seek Sophie pre-interview task.

## The core idea

> "Which note did each claim come from?" and "what does the system do when the LLM hallucinates?" are the **same problem**.

The answer is **grounded, two-step generation with per-claim source attribution**:

1. **Parse & segment** — every uploaded file is split into segments `S1…Sn`, each tagged with its source filename. Embedded `.docx` images are extracted to Vercel Blob. This pool of segments is the _only_ source of truth the model may use.
2. **Plan** (1 LLM call) — produces everything structured _except_ prose: article type, title, an ordered section skeleton (each section assigned the segment ids it should draw from), key facts, best-for / not-for, ethics & safety, tips, FAQ, plus **`openQuestions`** (what a published guide needs that the notes don't contain) and a non-travel guard.
3. **Human checkpoint** — the _Skeleton Review_ screen lets the author edit headings/intents, reorder, and reassign segments before any prose is written.
4. **Draft** (N parallel calls, concurrency-capped) — each section is drafted from _only its assigned segments_. Every claim carries a `provenance` (`sourced` / `ai_added`) and the source ids it used.

Two independent lines defend against hallucination:

- The model is forced into a **Zod-validated structured output** (no free-text-then-parse).
- The server **re-validates every source id** against the real segment pool and strips ghosts — at plan time, at draft time, and on every autosave PATCH.

In the editor, each claim is tinted by provenance — 🟢 `sourced`, 🟡 `ai_added` (flagged "verify"), 🔵 `human` (set the moment you edit it). A summary bar counts grounded / unverified / open-questions and **soft-gates** saving while AI-added claims remain unverified. Clicking any claim shows the exact source segment + filename it came from.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind v4
- **Prisma 7** + **Supabase Postgres** — article stored as a JSON-aggregate
- **Vercel AI SDK** (`generateObject` + Zod) over an OpenAI-compatible **LiteLLM** gateway
- **Vercel Blob** for extracted/uploaded images (auth via Vercel OIDC)
- **Self-built auth** — email/password, bcrypt + a `jose` JWT session cookie. Authorization lives in the service layer (every query is scoped by `userId`, every mutation re-checks ownership) — deliberately **not** Postgres RLS, so ownership is one testable source of truth in code.

## Architecture

`Route Handler / Server Action → Service → Repository`, layered under `src/server/`. The article is one aggregate document persisted as JSON; the pipeline is staged and persisted (`planned → drafting → ready`) so a refresh mid-flight always recovers.

## Running locally

```bash
pnpm install
cp .env.example .env   # fill in the values below
pnpm db:migrate        # create the schema
pnpm dev               # http://localhost:3000
```

### Environment

| Var                                                      | Purpose                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`                                           | Supabase Postgres connection string                                   |
| `LITELLM_BASE_URL` / `LITELLM_API_KEY` / `LITELLM_MODEL` | OpenAI-compatible LLM gateway                                         |
| `AUTH_SECRET`                                            | session-signing secret (`openssl rand -base64 32`)                    |
| `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`                    | Vercel Blob auth (auto-injected on Vercel; `vercel env pull` locally) |

### Tests

```bash
pnpm test         # Vitest — parser, source-id validation, auth, content helpers, markdown export
pnpm type-check
pnpm build
```

## Using it

1. Sign up (open registration, no email verification).
2. **New article** → drop one or more `.docx` / `.txt` / `.md` files → **Plan**.
3. Review/adjust the skeleton → **Draft all**.
4. Edit any field; click claims to see their source; mark them verified; add images from your notes or upload new ones.
5. **Copy as Markdown** to take it into a CMS.

Sample fixtures used during development live in `samples/` (a Komodo pocket guide with embedded images, multi-file Chiang Mai elephant notes, a Sapa transcript, and two edge cases — an empty file and non-travel junk).

## Scope notes

This handles the unhappy path on purpose: bad/empty/unsupported uploads, partial file failures, LLM JSON/timeout failures (with retry, preserving the upload), partial draft failures (per-section retry), oversized inputs (capped + flagged), and non-travel notes (detected, never fabricated). Consciously cut for the time box: multi-experience splitting, conflict-resolution UI, article-type selection, version history, library search, email verification / rate-limiting, a semantic AI-verifier pass, and OCR/audio/PDF ingestion.

## Known limitations / conscious tradeoffs

- **No optimistic-concurrency on the article row.** Autosave is suspended while a section is (re)generating so a stale PATCH can't clobber a fresh draft, and an interrupted draft can be re-triggered from the UI. But image uploads use a read-modify-write on the `media` array — two uploads fired at the exact same moment could drop one. A real fix is a row-level append/transaction or a version column; out of scope for the time box.
- **Single image-storage region, public Blob URLs.** Fine for this tool; a production setup would scope access and add a CDN.
