# TASK.md — Pathfolio

Active work, backlog, and milestones. Update as the project progresses: mark
items done and add anything discovered mid-process.

## Status

- **Current phase:** Phase 3 complete for jobs; Phase 4 (apply by email) partially live; school search (US-05) still open
- **In progress:** none
- **Blocked:** none

## Key decisions

- Hosted-ready now, deployed to **Vercel** (not local-first).
- **Next.js 15 (App Router) + React 18 + TypeScript**, web-only interface.
- **Postgres + Drizzle** (Vercel Postgres store `fullstack`), configured via env.
- Uploaded/generated files stored in **Postgres** (no blob storage in v1).
- Automated form filling (Playwright) does not run on Vercel: use **guided
  steps** for hosted v1; Playwright enabled local-only via `ENABLE_PLAYWRIGHT` env flag.
- **OpenRouter** for LLM calls (via `OPENROUTER_API_KEY`), behind a swappable service interface. Default is a **free-tier model chain** (`nvidia/nemotron-3-ultra-550b-a55b:free` → `nvidia/nemotron-3-super-120b-a12b:free` → `dots-studio/dots-3-note-preview:free` → `poolside/laguna-s-2.1:free`) since the account has 0 credits; override with the `OPENROUTER_MODEL` env var. (Paid default was `anthropic/claude-sonnet-4.6`, before that the retired `anthropic/claude-3.5-sonnet`.)
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

- [x] Region + role type filter (US-03) — `lib/services/search/filters.ts`, exposed on `/dashboard/search`; Rwanda and Africa regions, plus worldwide-remote matching
- [x] Job API integrations — Remotive, Greenhouse, Lever, Jobicy, **Jobweb Rwanda** (RSS) and **opportunity.ini.rw** (public JSON API) live without keys; Adzuna + Jooble wired but inert until `ADZUNA_APP_ID`/`ADZUNA_APP_KEY`/`JOOBLE_API_KEY` are set (the UI reports them as "not configured")
- [x] Natural-language location parsing ("backend developer in Rwanda" → role + region), `lib/services/search/query.ts`
- [x] Open/closed filter — deadlines parsed from postings (`lib/services/search/deadline.ts`); expired jobs hidden by default, toggle on `/dashboard/search`
- [x] Match score + missing skills per job (US-04) — `lib/services/search/match.ts`, scored against the saved profile
- [ ] School program search with requirements + source link (US-05 — PLANNING books this for Phase 7)

### Phase 4 — Apply by email

- [x] Extract application email from posting, show source (US-09) — `lib/services/apply/extract.ts` reads mailto links, visible text and inline scripts; an unfound address stays empty rather than guessed
- [x] Compose/send/draft email with tailored attachments (US-10) — `/api/jobs/prepare` drafts from the master profile (`application-email@1.0.0`) and `/api/jobs/send` requires `approved: true`, attaches a DOCX CV built from the profile, and records the application
- [ ] Guided-form filling falls back to the posting link only (no browser automation on Vercel)

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

- **OpenRouter credits:** the account has **0 credits**, so paid models fail with 402. The LLM wrapper now defaults to free ($0) models with an automatic fallback chain on 402/403/404/429/5xx, so tailoring and AI CV extraction work without credits. Adding credits (https://openrouter.ai/settings/credits) + `OPENROUTER_MODEL` lets you switch back to paid models.
- **Free-model gotcha:** reasoning models spend most of `max_tokens` on hidden reasoning; at 2300 the visible JSON was truncated (`finish_reason: length`) and validation got `null`. Extraction now budgets 8000 tokens (same for the default `DEFAULT_MAX_TOKENS`). Also: free endpoints are slow and can 429 under bursts — the fallback chain absorbs both.
- **Model selection (benchmarked on the real CV, 8 free candidates):** `nvidia/nemotron-3-ultra-550b-a55b:free` is the default — 36–55s per extraction (3/3 runs), clean skills with no category labels. Kept as fallbacks: `nemotron-3-super-120b` (~73s), `dots-3-note-preview` (~78s, different provider), `laguna-s-2.1` (~129s). Rejected: `gemma-4-31b` / `gemma-4-26b` (429 on every call), `nemotron-3.5-lightning` (>240s timeout), `nemotron-3.5-super-vl` (117s), `xing4.0` (invalid JSON), `openrouter/free` (safety message, not JSON), `liquid/lfm-2.5-2.6b` (fast but emits category labels like "DevOps & Tools").
- **Security (needs action):** a real Postgres connection string (Neon store `fullstack`) is committed in `.env.example` and remains in git history (commit `5ee2d3e`). It is replaced with a placeholder now, but the credential must be **rotated** in the Vercel/Neon dashboard and, if desired, purged from history. `.env` itself is gitignored and untracked.
- **Dev workflow:** `npm run build` writes production chunks into `.next`; running it (or a second dev server) while `npm run dev` is live corrupts the running session → `GET / 404`, wedged server, or `TypeError: __webpack_require__.n is not a function`. Never run build and dev at the same time; clear `.next` (`rm -rf .next`) between a build and a dev session, and if the dev server stops listening, kill it and restart clean.
- **Scanned PDFs cannot be read.** `Curriculum_Vitae_caleblevy.pdf` is image-only (3 page images, zero `/Font` objects), so `pdf-parse` returns 6 newlines. `/api/cv/upload` now returns **422** — "No readable text found… upload a DOCX or text-based PDF" — and the Upload CV panel shows that message instead of a fake success. OCR for image-only PDFs is not implemented (would need tesseract); the DOCX version of the same CV works.
- **Rwanda search sources:** `opportunity.ini.rw` exposes a public JSON API (`https://opportunityapi.ini.rw/api/opportunities`, capped at 250 jobs, `closing_date` included) and `jobwebrwanda.com` serves a WordPress search RSS feed (`/feed/?s=<query>&paged=N`). Both are used by search; **LinkedIn is deliberately not scraped** (its terms forbid automation) — paste a LinkedIn job link into the tailoring flow instead.
- **"Results load but the page stays empty"** was a stale `.next` client bundle after a production build ran against the dev server (the documented build/dev clash). `rm -rf .next` + a clean `npm run dev` fixed it; the API was healthy the whole time.
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
- 2026-10-17 — Task 20: CV uploader made visible + free-model LLM switch. (a) The **Upload CV tab** on the profile page had no content (its footer button was conditionally hidden) — added a real upload panel with dropzone, progress and apply-state hints; quick-action "Upload CV" now opens `?tab=upload` which selects that tab. (b) `/profile` 404'd after the page moved to `/dashboard/profile` — added a redirect in `next.config.mjs` and fixed the header/quick-action links. (c) `/api/cv/upload` rejected files whose MIME type was empty/`octet-stream` — now falls back to the file extension. (d) Switched the default LLM to free models (chain + `OPENROUTER_MODEL` override) and fixed the truncation bug (maxTokens 2300 → 8000, `finish_reason: length` → `stop`). Verified: tsc 0, lint 0, tests 66 passed + 1 gated live test (passes with key), build 0, live upload returns `source: ai` with 41 skills / 6 experience / 3 education / 6 projects, `/profile` 307→200.
- 2026-10-17 — Task 19: Upgraded Next.js 15.0.0 → **15.5.28** (user-requested: "Next.js outdated" + persistent `__webpack_require__.n` hydration runtime error). The root trigger was still `.next` contamination (a build ran against a live dev server at 17:53, leaving it not listening). After upgrade: `tsc --noEmit` 0, lint 0 (note: `next lint` is deprecated, removal planned in Next 16), tests 66/66, build 0 (17 routes), fresh dev server serves all pages + chunks 200 with no errors.
- 2026-10-16 — Task 16: Phase 2 tracker (US-16, US-17, US-19, US-20, US-21) — application + opportunity records with duplicate warning, status/age filters ("no reply after N days"), follow-up dates, and CSV export. New services `lib/services/tracker/{index,filters,export,dedupe}.ts`; API routes `/api/applications`, `/api/applications/[id]`, `/api/applications/export`, `/api/stats`; a real tracker list and new-application form; dashboard stats and recent activity now read live data. 23 new unit tests (46 total). Verified end-to-end against Postgres: create → duplicate 409 → patch → filter → CSV → delete, then cleaned up the test rows.
- 2026-10-18 — Task 21: Benchmarked every viable **free** OpenRouter model against the real CV (8 models, `ai` SDK, same prompt/schema/maxTokens) and switched the default from `nvidia/nemotron-3-super-120b-a12b:free` to `nvidia/nemotron-3-ultra-550b-a55b:free`: 36–55s and clean sections on 3/3 runs (vs 73s). New chain: ultra → nemotron-3-super-120b → dots-3-note-preview → laguna-s-2.1; dropped `gemma-4-31b` (429 on every call). Rejected on evidence: gemma-4-26b (429), nemotron-3.5-lightning (timeout >240s), nemotron-3.5-super-vl (117s), xing4.0 (invalid JSON), openrouter/free (safety text, not JSON), liquid/lfm-2.5-2.6b (fast but emits category labels). `.env.example` + key decisions updated.
- 2026-10-18 — Task 22: Fixed the silent empty-CV success. A scanned, image-only PDF parsed to 6 newlines, yet the API answered `source: 'ai'` with an empty `suggestedProfile`. (a) `hasUsableCVText()` (`MIN_CV_TEXT_LENGTH = 40`) in `cv-parser.ts`; `buildSuggestedProfile` now skips the LLM for unreadable text and only reports `source: 'ai'` when it extracted at least one real field (name/email/skills/experience/education/projects). (b) `/api/cv/upload` returns **422** with an actionable message for unreadable files. (c) The Upload CV panel surfaces `data.error` instead of failing silently. 7 new unit tests. Verified live: scanned PDF → 422 in <1s; DOCX → `source: ai`, 32 skills / 6 experience / 3 education / 6 projects in 25s.
- 2026-10-18 — Task 23: Phase 3 job search (US-03, US-04). New `lib/integrations/search-apis/` adapters (Remotive, Greenhouse, Lever, Adzuna, Jooble) and `lib/services/search/` (region/role filters, dedupe, match score + missing skills), `/api/jobs/search` (400 on missing query or bad filter), and a `/dashboard/search` page with region/role selects, match bars and per-source status. 27 new unit tests (100 total). Verified live: `developer` → 27 jobs from Greenhouse + Remotive in ~7s, `remote`+`full-time` filter → 0 violations, missing `q` and `region=mars` → 400. Fixed along the way: Jooble sends `"Full-time"` (hyphenated) so its type map missed it, and Greenhouse returned `roleType: 'unknown'` for every posting — both now normalise/infer via `role-type.ts`. Note: match scores stay 0% until a master profile exists (currently no profile row).
- 2026-10-18 — Task 24: Rwanda-first job search. (a) Added **Jobweb Rwanda** (`lib/integrations/search-apis/jobwebrwanda.ts`, RSS search feed, HTML-stripped descriptions, deadline parsing) and **opportunity.ini.rw** (`opportunity-rw.ts`, public JSON API of approved Rwandan jobs with `closing_date`) plus **Jobicy** (`jobicy.ts`, free remote feed with `anywhere`/`emea` regions) — the previous sources could not return Rwanda jobs at all. (b) `rwanda` region + richer Africa keywords + worldwide/EMEA remote matching in `filters.ts`. (c) Natural-language parsing (`lib/services/search/query.ts`) so "backend developer in Rwanda" sets the role and region, and the API echoes `interpreted`. (d) Synonym-aware keyword matching (`query-match.ts`) so "developer" finds "Software Engineer" on company boards. (e) Open/closed filtering (`lib/services/search/deadline.ts`): deadlines are parsed only when labelled, expired jobs are hidden by default, and a checkbox includes them. 19 new tests. Verified live: `developer in Rwanda` → 30 jobs from jobicy + jobwebrwanda + opportunityrw + remotive in ~14s, default results contain 0 past-deadline jobs while `includeClosed=true` returns 18.
- 2026-10-18 — Task 25: Application kit (US-09/US-10 draft). `lib/services/apply/` adds posting analysis (`extract.ts`: emails from mailto/visible text/inline scripts, requested documents, deadline, requirements, apply route + SSRF-guarded fetch in `fetch-posting.ts`), email drafting (`email.ts`, versioned `application-email@1.0.0` prompt with a truthful offline template fallback) and a DOCX CV built from master-profile fields (`cv-document.ts`). `/api/jobs/prepare` returns the draft + posting facts + attachment name; `/api/jobs/send` refuses without `approved: true`, sends through Nodemailer with the CV attached, and records the application. UI: a per-job "Prepare application" panel with recipient, editable subject/body, requested documents, copy/save-draft and an explicit approve-and-send step. Verified live: Echowa posting → `careers@echowa.com` found on the page, AI draft in 14-38s, `source: ai`, attachment `CALEB-LEVY-BUNTU-CV.docx`; send without approval → 400, invalid recipient → 400; the prepare panel was opened and rendered in headless Chrome. No real email was sent during verification. 14 new tests.
