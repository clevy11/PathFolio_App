# Pathfolio

**Apply smarter. Track everything.**

A private assistant for job and school applications. Pathfolio finds
opportunities, tailors your CV and cover letters to each one **without inventing
facts**, applies by the best available route, and keeps a complete record of
every application you send.

![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Drizzle-4169E1?logo=postgresql&logoColor=white)
![Deploy: Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)
![License: MIT](https://img.shields.io/badge/License-MIT-green)
![AI: OpenRouter](https://img.shields.io/badge/AI-OpenRouter-6C47FF)

> **Status:** pre-alpha — Phase 1 scaffolding in progress. See [TASK.md](./TASK.md).
>
> **Repo:** https://github.com/clevy11/PathFolio_App.git

---

## Why

Applying is slow and repetitive. Every job or program needs a tailored CV and
cover letter, every employer wants a different apply method (email, web form, or
portal), requirements and deadlines change every year, and after 20–30
applications it's easy to lose track of where you applied, what you sent, and who
never replied.

Pathfolio handles the whole cycle in one place — so you stop spending hours on
repetitive application work and get things done.

## What it does

**1. Find** — search jobs and school programs by region and role type, each with
a **match score** and a list of missing skills or requirements.

**2. Tailor** — generate a tailored CV, cover letter, application email, or
statement of purpose. Every change is shown side by side so you can accept or
reject it. Documents are built **only from your master profile** — nothing is
invented.

**3. Apply** — Pathfolio detects the route and takes it:

| Route | When | What happens |
| --- | --- | --- |
| **A. Email** | The post lists an application email | Drafts the email, attaches your tailored documents, sends or saves as draft after your approval |
| **B. Form** | The post links to a web form | Fills what it can and **pauses before Submit**; falls back to guided steps when automation isn't available |
| **C. Guided** | No email/simple form, or a portal | Numbered instructions: which page, what to click, what to prepare |

**4. Track** — every application is saved automatically, with duplicate
warnings, status/age filters ("no reply after 14 days"), follow-up reminders, and
one-click CSV export.

## Core principles

These are enforced in code, not just intent:

- **Never invent facts.** No skills, jobs, degrees, dates, emails, deadlines, or
  requirements that aren't in your profile or the real source page.
- **Always show the source.** Every extracted detail links back to where it came
  from — or says "not found".
- **Human in the loop.** Pathfolio pauses for your approval before anything is
  sent or submitted.
- **Everything is recorded.** Manual or automatic, every application is tracked.
- **Private by default.** Your data lives in your own database; no third-party
  analytics or tracking.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | Postgres via Drizzle ORM (Vercel store `fullstack`) |
| Hosting | Vercel (Postgres, serverless functions) |
| AI | OpenRouter (LLM API for tailoring, summarizing, writing) |
| Web reading | Cheerio |
| Web forms | Guided steps (Playwright local-only via `ENABLE_PLAYWRIGHT` env flag) |
| Email | Nodemailer / Gmail API |
| CV parsing | pdf-parse, mammoth, docx |

## Getting started

```bash
git clone https://github.com/clevy11/PathFolio_App.git
cd PathFolio_App
npm install
cp .env.example .env      # add your database URL, LLM and email credentials
npm run dev               # http://localhost:3000
```

## Deployment

Pathfolio deploys to **Vercel**. Connect the repository, set the environment
variables (database URL, LLM key, email credentials) in the Vercel project, and
push to `main`.

## Roadmap

| Phase | Milestone |
| --- | --- |
| 1 | Master profile + paste a job description → tailored CV & cover letter |
| 2 | Application tracker, duplicate warning, CSV export |
| 3 | Job search by region/role type with match score |
| 4 | Application email extraction and sending |
| 5 | Step-by-step guides + school document checklist |
| 6 | Form filling with review before submit |
| 7 | School search, deadline reminders, inbox matching, interview prep |

Full detail in [PLANNING.md](./PLANNING.md).

## Documentation

- [PLANNING.md](./PLANNING.md) — vision, architecture, data model, roadmap
- [TASK.md](./TASK.md) — current tasks, backlog, milestones
- [AGENTS.md](./AGENTS.md) — working agreement for AI-assisted development

## License

[MIT](./LICENSE) © 2026 Caleb levy Buntu
