# TASK.md — Pathfolio

Active work, backlog, and milestones. Update as the project progresses: mark
items done and add anything discovered mid-process.

## Status

- **Current phase:** Phase 1 — Master profile + paste JD → tailored CV/cover letter
- **In progress:** Reusable saved answers CRUD (US-02)
- **Blocked:** none

## Key decisions

- Hosted-ready now, deployed to **Vercel** (not local-first).
- **Next.js 15 (App Router) + React 19 + TypeScript**, web-only interface.
- **Postgres + Drizzle** (Vercel Postgres store `fullstack`), configured via env.
- Uploaded/generated files stored in **Postgres** (no blob storage in v1).
- Automated form filling (Playwright) does not run on Vercel: use **guided
  steps** for hosted v1; Playwright enabled local-only via `ENABLE_PLAYWRIGHT` env flag.
- **OpenRouter** for LLM calls (via `OPENROUTER_API_KEY`), behind a swappable service interface.
- **Design inspiration:** OrbitalJob (dark navy/glass panels, emerald+azure accents, Space Grotesk+Inter, Phosphor icons) — https://ub12jz5t.host.uxpilot.net

## In progress

- none

## Backlog

### Phase 1 — Master profile and tailoring

- [x] Project scaffolding (Next.js 15 App Router + React 19 + TypeScript, Tailwind + shadcn/ui,
      ESLint/Prettier, Vitest, folder layout `app/` `components/` `lib/` `tests/`, `.env.example`)
- [x] Postgres schema + Drizzle migrations for `profile`, `opportunity`,
      `application`, `document`, `checklist_item`, `reminder`
- [x] CV upload + parse (pdf-parse, mammoth, docx) into editable sections (US-01)
- [x] Master profile CRUD (US-01)
- [ ] Reusable saved answers CRUD (US-02)
- [ ] OpenRouter client wrapper + prompt/version handling
- [ ] Paste a job description → tailored CV from master profile only (US-06)
- [ ] Change review: side-by-side diff, accept/reject each change (US-07)
- [ ] Cover letter / motivation letter generation, editable (US-08)

### Phase 2 — Tracker

- [ ] Auto-record every application (US-16)
- [ ] Duplicate warning before applying (US-17)
- [ ] Store and reopen sent CV/cover letter versions (US-18)
- [ ] Filter by status and age, e.g. "no reply after 14 days" (US-19)
- [ ] Follow-up reminders (US-20)
- [ ] Export all applications to CSV (US-21)

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
