# CLAUDE.md

This file is automatically loaded by Claude Code at the start of every session.

## What This Project Is

A Next.js starter template for non-technical users who build with AI. The primary workflow:
the user describes what they want in plain English, and Claude builds it. Claude should
never ask the user to run commands — run them yourself.

## Stack

- **Next.js 16** (App Router) — file-based routing under `src/app/`
- **React 19** with TypeScript
- **Tailwind CSS v4** — utility-first, no `tailwind.config.*` file; imported via `@import "tailwindcss"` in `globals.css`
- **pnpm** — always use `pnpm`, never `npm` or `yarn`
- **PWA** via `@ducanh2912/next-pwa`
- **Prisma 7 + Postgres** — backend/database (server-only); **Zod** for input validation

## File Map

| File / Folder           | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `src/app/page.tsx`      | Main entry page — start all UI work here                          |
| `src/app/layout.tsx`    | Global layout, fonts, metadata                                    |
| `src/app/providers.tsx` | Client-side global providers (SWR, contexts)                      |
| `src/app/globals.css`   | Global styles and Tailwind import                                 |
| `src/app/manifest.ts`   | PWA manifest                                                      |
| `src/components/`       | Reusable React components (`PascalCase.tsx`)                      |
| `src/contexts/`         | React Context providers (`XxxProvider.tsx`)                       |
| `src/hooks/`            | Custom hooks (`useXxx.ts`)                                        |
| `src/lib/`              | Framework-agnostic utilities (API client, routes)                 |
| `src/helpers/`          | Pure domain helpers + barrel `index.ts`                           |
| `src/types/`            | Shared TypeScript types (`index.ts`)                              |
| `src/server/`           | Backend: db / repositories / services / validations (server-only) |
| `src/app/api/`          | Route Handlers (HTTP endpoints, webhooks)                         |
| `prisma/schema.prisma`  | Database schema (models, migrations source)                       |

## Code Organization

Source lives under `src/`, split by responsibility. Import with the `@/` alias
(e.g. `import { useQuery } from '@/hooks/useQuery'`).

- `src/app/` — routes, layout, metadata (App Router). Server Components by default.
- `src/components/` — reusable UI, `PascalCase.tsx`.
- `src/contexts/` — Context providers, `XxxProvider.tsx`.
- `src/hooks/` — custom hooks, `useXxx.ts` (add `'use client'`).
- `src/lib/` — framework-agnostic utilities (`api_client.ts`, `routes.ts`).
- `src/helpers/` — pure helpers grouped by domain, re-exported from `index.ts`.
- `src/types/` — shared types, exported from `index.ts`.

## Code Style

- **Comments:** Write self-documenting code; comment sparingly. Add a comment
  only to explain _why_ (a non-obvious decision, trade-off, gotcha, or security
  note) or to document a non-obvious public API contract — never to restate what
  the code already says, label obvious sections, or narrate each line. Prefer a
  clearer name over a comment.

## Data Fetching (SWR)

Client-side data fetching uses [SWR](https://swr.vercel.app), wired through one wrapper:

- `src/lib/api_client.ts` — `fetcher` (throws `ApiError` with the HTTP status,
  camelizes snake_case keys), `buildUrl`, and `API_BASE_URL`
  (from `NEXT_PUBLIC_API_BASE_URL`).
- `src/hooks/useQuery.ts` — wraps `useSWR` with project defaults:

  ```tsx
  'use client';
  import { useQuery } from '@/hooks/useQuery';

  const { data, error, isLoading } = useQuery<User>('/api/me');
  // Pass `null` as the key to skip the request (conditional fetching).
  ```

- `src/app/providers.tsx` — `<SWRConfig>` + global providers, mounted in `layout.tsx`.

**Prefer Server Components for initial page data** (fetch directly in an async
`page.tsx`). Reach for `useQuery`/SWR only for interactive client-side data that
revalidates — user actions, polling, or data behind a click.

## Backend (`src/server/`)

Server-only code, layered so route handlers and actions stay thin:

```
Route Handler / Server Action  →  Service (logic)  →  Repository (DB)
```

- `src/server/db/` — Prisma client singleton (`@/server/db`).
- `src/server/repositories/` — raw DB queries only, no logic.
- `src/server/services/` — business logic; the reusable layer.
- `src/server/validations/` — Zod schemas, used at the I/O boundary.
- Every file starts with `import 'server-only';` so it can never be bundled into
  a client component. Server secrets use `process.env.X` (no `NEXT_PUBLIC_`).

**Data flow:**

- **Read (initial):** Server Component calls a service directly — no HTTP hop
  (`const posts = await postService.list()`). See `src/app/posts/page.tsx`.
- **Read (interactive client):** expose a Route Handler (`src/app/api/.../route.ts`)
  and call it from the client with `useQuery`.
- **Write:** Server Action (`actions.ts`, `'use server'`) → validate with Zod →
  service → `revalidatePath()`. See `src/app/posts/actions.ts`.
- **Webhooks / 3rd-party / mobile:** Route Handler.

**Security:** Server Actions and Route Handlers are **public endpoints** — verify
auth/authorization **inside** each one (don't rely on page/layout guards). Each
route segment that can fail should have an `error.tsx` (see `src/app/posts/`).

A full sample resource (`Post`) flows through every layer:
`prisma/schema.prisma` → repository → service → `api/posts/route.ts` +
`posts/actions.ts` + `posts/page.tsx`.

**Database (Prisma):** define models in `prisma/schema.prisma`, then:

```bash
pnpm db:migrate   # create + apply a migration in dev (also runs generate)
pnpm db:generate  # regenerate the typed client after schema edits
pnpm db:studio    # open Prisma Studio (visual DB browser)
```

The Postgres URL comes from `DATABASE_URL` in `.env` (see `.env.example`). The
generated client lives in `src/generated/prisma` (git-ignored — regenerated on
install via `postinstall`).

## Dev Workflow

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Production build (run before deploying)
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format all files with Prettier
pnpm type-check   # TypeScript type checking
pnpm test         # Run unit + integration tests once (Vitest)
pnpm test:watch   # Run Vitest in watch mode
pnpm test:e2e     # Run end-to-end tests (Playwright)
```

Always run `pnpm lint:fix && pnpm format` before committing.

## Testing

Two runners, split by test type and location:

| Type        | Location                            | Runner     | Command         |
| ----------- | ----------------------------------- | ---------- | --------------- |
| Unit        | co-located `*.test.ts(x)` by source | Vitest     | `pnpm test`     |
| Integration | `tests/integration/*.test.ts`       | Vitest     | `pnpm test`     |
| E2E         | `tests/e2e/*.spec.ts`               | Playwright | `pnpm test:e2e` |

- **Vitest** (`vitest.config.ts`) runs unit + integration in jsdom. It resolves
  the `@/` alias and stubs `import 'server-only'` (`tests/stubs/`) so server-layer
  modules are testable. Matchers set up in `vitest.setup.ts`.
- **Playwright** (`playwright.config.ts`) runs E2E against a dev server it starts
  itself. First run needs browsers: `pnpm exec playwright install`.
- Samples by layer: helper (`src/helpers/case.test.ts`), component/hook
  (`src/components/Flash.test.tsx`), service with mocked repo
  (`src/server/services/post.service.test.ts`), and API-route integration
  (`tests/integration/posts-api.test.ts`).

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org):
`feat:` · `fix:` · `docs:` · `style:` · `refactor:` · `chore:`

Husky + commitlint enforce this on every commit.

## Available Skills

Check `.agents/skills/` for capabilities Claude can invoke:

| Skill                           | Use for                                             |
| ------------------------------- | --------------------------------------------------- |
| `next-best-practices`           | Next.js patterns and conventions                    |
| `vercel-react-best-practices`   | React performance and best practices                |
| `vercel-composition-patterns`   | React component composition patterns                |
| `vercel-react-view-transitions` | Animated route/UI transitions (View Transition API) |
| `ui-ux-pro-max`                 | Advanced design system references                   |
| `web-design-guidelines`         | Web design guidelines and standards                 |
