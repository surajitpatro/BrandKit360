# BrandKit360

Full-stack brand-system platform. A founder uploads a logo, answers a five-question
wizard, and gets a complete, structured brand system — DNA, palette, typography,
photography direction, voice — compiled into living brand guidelines with
AI-generated reference imagery and collateral mockups.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite · Tailwind · shadcn/ui |
| API | tRPC 11 · Hono |
| Database | Drizzle ORM — MySQL (current platform) / Supabase Postgres (migration target, `db/pg/`) |
| Object storage | Platform TOS (current) / Supabase Storage (migration target) |
| Auth | Supabase Auth — Google provider (migration target) |
| AI imagery | Server-side image-generation gateway (`api/lib/imageGen.ts`) |

## Repository map

```
api/            tRPC routers, auth, storage, imagery pipeline (server-only)
contracts/      Shared types (BrandData, plans, entitlements)
db/             Drizzle schema (MySQL) + supabase/pg port + migrations
src/            React app — pages, studio sections, wizard
supabase/       Postgres migration SQL + (later) edge config
```

## Scripts

```bash
npm run dev            # vite dev server
npm run build          # production bundle (dist/boot.js)
npm run start          # run production server
npm run check          # typecheck

# database
npm run db:generate    # MySQL migration files (drizzle-kit)
npm run db:generate:pg # Postgres migration files (Supabase target)
npm run db:migrate:pg  # apply Postgres migrations (needs SUPABASE_DB_URL)
npm run db:smoke:pg    # round-trip smoke test against a live Postgres
```

## Environment

Copy `.env.example` → `.env`. Secrets (database URLs, Supabase service-role key,
image-generation gateway key) are server-only and must never be committed —
`.gitignore` enforces this.

## Product principles

- The structured `BrandData` object is the source of truth; guidelines are
  compiled output, never hand-assembled.
- Every AI image is generated from the brand's own tokens and labelled
  "AI-generated reference imagery — not a photograph of a real product".
- Storage and generation quota are enforced server-side, per plan.
