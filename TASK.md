# TASK.md — Pathfolio

Active work, backlog, and milestones. Update as the project progresses: mark
items done and add anything discovered mid-process.

## Status

- **Current phase:** Phase 2 complete (tracker) — moving to Phase 3 (search)
- **In progress:** none
- **Blocked:** none

## Key decisions

- Hosted-ready now, deployed to **Vercel** (not local-first).
- **Next.js 15 (App Router) + React 18 + TypeScript**, web-only interface.
- **Postgres + Drizzle** (Vercel Postgres store `fullstack`), configured via env.
- Uploaded/generated files stored in **Postgres** (no blob storage in v1).
- Automated form filling (Playwright) does not run on Vercel: use **guided
  steps** for hosted v1; Playwright enabled local-only via `ENABLE_PLAYWRIGHT` env flag.
- **OpenRouter** for LLM calls (via `OPENROUTER_API_KEY`), behind a swappable service interface. Default model `anthropic/claude-sonnet-4.6` (updated from the retired `anthropic/claude-3.5-sonnet`).
- **Design inspiration:** OrbitalJob (dark navy/glass panels, emerald+azure accents, Space Grotesk+Inter, Phosphor icons) — https://ub12jz5t.host.uxpilot.net

## In progress

- none

## Backlog

### Phase 1 — Master profile and tailoring

- [x] Project scaffolding (Next.js 15 App Router + React 18 + TypeScript, Tailwind + shadcn/ui,
      ESLint/Prettier, Vitest, folder layout `app/` `components/` `lib/` `tests/`, `.env.example`)
- [x] Postgres schema + Drizzle migrations for `profile`, `opportunity`,
      `application`, `document`, `checklist_item`, `reminder`
- [x] CV upload + parse (pdf-parse, mammoth, docx) into editable sections (US-01) — now AI-structured extraction (`lib/services/profile/cv-extract.ts`, prompt `cv-extraction@1.0.0`) with a rewritten deterministic fallback (`cv-parser.ts`)
- [x] Master profile CRUD (US-01)
- [x] Reusable saved answers CRUD (US-02)
- [x] OpenRouter client wrapper + prompt/version handling (`lib/integrations/llm/prompts.ts`)
- [x] Paste a job description → tailored CV from master profile only (US-06)
- [x] Change review: side-by-side source vs tailored output, editable, approve/regenerate
      (US-07 — per-change accept/reject still deferred)
- [x] Cover letter generation, editable (US-08 — motivation letter / statement of purpose deferred)

### Phase 2 — Tracker

- [x] Auto-record every application (US-16)
- [x] Duplicate warning before applying (US-17)
- [ ] Store and reopen sent CV/cover letter versions (US-18 — deferred; needs the tailoring flow wired to applications)
- [x] Filter by status and age, e.g. "no reply after 14 days" (US-19)
- [x] Follow-up reminders (US-20 — follow-up dates tracked and surfaced in the tracker; separate `reminder` records deferred)
- [x] Export all applications to CSV (US-21)

### Phase 3 — Search

- [ ] Region + role type filter (US-03)
- [ ] Job API integrations (Adzuna, Jooble, Remotive, Greenhouse, Lever)
- [ ] Match score + missing skills per job (US-04)
- [ ] School program search with requirements + source link (US-05)

### Phase 4 — Apply by email

- [ ] Extract application email from posting, show source (US-09)
- [ ] Compose/send/draft email with tailored attachments (US-10)

### Phase 5 — Guides and school checklist

- [ ] Step-by-step guide when no email/form (US-13)
- [ ] Per-school document checklist with deadlines (US-14)
- [ ] Deadline reminders (US-15)

### Phase 6 — Form filling

- [ ] Guided form-filling flow for the hosted app (US-11)
- [ ] Ask user when unsure; pause before Submit (US-12)
- [ ] (later) Playwright auto-fill, local-only via `ENABLE_PLAYWRIGHT` env flag

### Phase 7 — Later

- [ ] Inbox matching to detect replies and update status (US-22)
- [ ] Interview question + talking point generation (US-23 / 8.10)

## Discovered

- **OpenRouter credits:** the account currently has **0 credits** (`total_credits: 0`), so every LLM call fails with 402. Tailoring and AI CV extraction degrade (extraction falls back to the offline parser); add credits at https://openrouter.ai/settings/credits to enable them.
- **Security (needs action):** a real Postgres connection string (Neon store `fullstack`) is committed in `.env.example` and remains in git history (commit `5ee2d3e`). It is replaced with a placeholder now, but the credential must be **rotated** in the Vercel/Neon dashboard and, if desired, purged from history. `.env` itself is gitignored and untracked.
- **Dev workflow:** `npm run build` writes production chunks into `.next`; running it (or a second dev server) while `npm run dev` is live corrupts the running session → `GET / 404`, wedged server, or `TypeError: __webpack_require__.n is not a function`. Never run build and dev at the same time; clear `.next` (`rm -rf .next`) between a build and a dev session, and if the dev server stops listening, kill it and restart clean.
- `lib/jobs/` and `app/(auth)/` are empty scaffolding directories.

## Done

- 2026-10-10 — Task 1: README rewritten as the GitHub project description
  (Vercel-hosted stack, real repo URL, guided-steps note).
- 2026-10-10 — Task 2: Docs edit pass complete — updated README.md (repo URL, author, OpenRouter, Next.js 15), PLANNING.md (Next.js 15, Vercel Postgres, Playwright local-only, OpenRouter), TASK.md (key decisions + Phase 1 scaffolding), AGENTS.md (server/client boundary, Drizzle, Vercel, Playwright env flag, OpenRouter), LICENSE (author "Caleb levy Buntu").
- 2026-10-10 — Task 3: Phase 1 scaffolding complete — Next.js 15 + React 18 + TypeScript + Tailwind + shadcn/ui (Button, Card) + Drizzle ORM schema + OpenRouter LLM wrapper + Zod validation + Vitest + ESLint/Prettier + folder layout (`app/`, `components/`, `lib/`, `tests/`) + `.env.example`. Tests pass (6/6), lint passes, typecheck passes.
- 2026-10-10 — Task 4: Drizzle migrations applied — 6 tables created in Vercel Postgres (`fullstack`): `profile`, `opportunity`, `application`, `document`, `checklist_item`, `reminder` with enums, FKs, indexes.
- 2026-10-10 — Task 5: CV upload + parse (pdf-parse, mammoth, docx) with section extraction → auto-fill profile form.
- 2026-10-10 — Task 6: Master profile CRUD (US-01) — tabbed editor (Overview, Skills, Experience, Education, Projects, Links) with inline add/edit/remove.
- 2026-10-10 — Task 7: Neural Tailoring Engine — paste JD → generate tailored CV & cover letter via OpenRouter (Claude 3.5 Sonnet), tabbed preview with copy/save.
- 2026-10-10 — Task 8: Dashboard (Mission Control) — stats cards (Match Index, Active Applications, Interview Pulse), recent activity feed, quick actions. Dark navy/glass theme per OrbitalJob inspiration.
- 2026-10-16 — Task 9: Reusable saved answers CRUD (US-02) — pure helpers in `lib/services/profile/saved-answers.ts` (`listSavedAnswers`, `setSavedAnswer`, `removeSavedAnswer`, `savedAnswerSchema`) with 12 unit tests, plus a "Saved Answers" tab in the CV Vault editor (add, edit, remove) persisted with the profile.
- 2026-10-16 — Task 10: Fixed the production build — `app/(dashboard)/profile/page.tsx` exported a named `ProfilePage`, which Next.js rejects; it is now a default export.
- 2026-10-16 — Task 11: Fixed the ESLint flat-config plugin key (`next` → `@next/next`), which had been failing silently and skipping all lint rules; fixed the 11 latent errors it surfaced (unused vars/imports, unnecessary regex escapes, `any` in the LLM wrapper). Lint and build now report no lint errors.
- 2026-10-16 — Task 12: Replaced the real Postgres URL in `.env.example` with a placeholder; reconciled the React version across README/PLANNING/TASK to the installed React 18; added the missing dashboard routes (`/dashboard/tailor`, `/dashboard/applications`, `/dashboard/applications/new`, `/dashboard/interviews`, `/dashboard/analytics`) so navigation no longer 404s.
- 2026-10-16 — Task 13: Prompt/version handling — tailoring prompts moved out of the API route into versioned `PromptTemplate`s in `lib/integrations/llm/prompts.ts` (`cv-tailoring@1.0.0`, `cover-letter@1.0.0`) with 5 unit tests; `/api/tailor` now returns the source profile and prompt versions.
- 2026-10-16 — Task 14: Change review (US-07) + editable output (US-08) — the tailoring engine now shows the source master profile side by side with an editable tailored document and an explicit "Approve document" step before use. Also fixed the `<body>` hydration mismatch (browser-extension attributes) with `suppressHydrationWarning`.
- 2026-10-16 — Task 15: Fixed the `__webpack_require__.n is not a function` runtime error by clearing the stale production `.next` artifacts before the dev session; documented the build/dev cache pitfall.
- 2026-10-16 — Task 17: CV upload now fills the profile fields. `lib/services/profile/cv-extract.ts` sends the CV text to OpenRouter with the versioned `cv-extraction@1.0.0` prompt and validates the JSON (tolerant of `null` fields), falling back to a rewritten deterministic `cv-parser.ts` that now extracts each entry separately with dates and links instead of mashing sections. `/api/cv/upload` returns `source: 'ai' | 'heuristic'`, and the CV Vault shows a note when the offline parser was used. Verified against the real `Caleb_Levy_Buntu_CV.docx`: AI path yields clean skills (no category labels), 6 experience entries with dates, 3 education entries, 6 projects.
- 2026-10-16 — Task 18: Fixed the LLM default model `anthropic/claude-3.5-sonnet`, which OpenRouter had retired (404 "No endpoints found") — that had silently broken tailoring too. Now `anthropic/claude-sonnet-4.6`; `getAvailableModels()` refreshed. CV extraction runs at `max_tokens: 2300` to fit small OpenRouter balances; a zero balance (402) falls back to the offline parser.
- 2026-10-17 — Task 19: Upgraded Next.js 15.0.0 → **15.5.28** (user-requested: "Next.js outdated" + persistent `__webpack_require__.n` hydration runtime error). The root trigger was still `.next` contamination (a build ran against a live dev server at 17:53, leaving it not listening). After upgrade: `tsc --noEmit` 0, lint 0 (note: `next lint` is deprecated, removal planned in Next 16), tests 66/66, build 0 (17 routes), fresh dev server serves all pages + chunks 200 with no errors.
- 2026-10-16 — Task 16: Phase 2 tracker (US-16, US-17, US-19, US-20, US-21) — application + opportunity records with duplicate warning, status/age filters ("no reply after N days"), follow-up dates, and CSV export. New services `lib/services/tracker/{index,filters,export,dedupe}.ts`; API routes `/api/applications`, `/api/applications/[id]`, `/api/applications/export`, `/api/stats`; a real tracker list and new-application form; dashboard stats and recent activity now read live data. 23 new unit tests (46 total). Verified end-to-end against Postgres: create → duplicate 409 → patch → filter → CSV → delete, then cleaned up the test rows.
