# PLANNING.md — Pathfolio

> Reference this file at the start of any new conversation.

## 1. Vision

Pathfolio is a personal, single-user tool that handles the full job and school
application cycle in one place: find opportunities, tailor documents truthfully,
apply by the best available route, and track everything. It cuts the time to
prepare one application from hours to minutes.

## 2. Problem

Applying for jobs and schools is slow and repetitive:

- Every application needs a CV and cover letter adjusted to the specific role or
  program.
- Every company or school uses a different apply method: an email address, a web
  form, or a multi-page portal.
- Required documents and deadlines differ and change every year.
- After 20–30 applications it is easy to forget where you applied, what you
  sent, and who has not replied.

## 3. Solution

1. **Find** matching jobs or programs by region and type.
2. **Tailor** the CV and cover letter to each one, without inventing facts.
3. **Apply** using the best route: email, automated form filling, or a
   step-by-step guide.
4. **Track** every application so nothing is forgotten.

## 4. User

The first and only user is the builder: a software engineer applying for jobs
(backend, frontend, etc.) and for school programs in one or more regions. No
accounts, payments, or public hosting are required. Design should stay
understandable to any developer in case it is shared later.

## 5. Goals and non-goals

**Goals**

- Cut preparation time per application from hours to minutes.
- Produce tailored documents that stay truthful to the original CV.
- Support three apply routes: email, automated form filling, guided steps.
- Keep a permanent, searchable history of all applications.

**Non-goals (v1)**

- No public product, user accounts, or billing.
- No mass-applying to hundreds of jobs. Quality over volume.
- No bypassing CAPTCHAs or breaking a site's terms of service.
- No fully automatic submission of school portals that need transcripts,
  payments, or recommendation letters.

## 6. Core principles (non-negotiable)

1. **Never invent facts.** The AI may reword and re-order real experience, but
   never add skills, jobs, degrees, or dates not in the master profile.
2. **Never invent contacts.** Emails, links, deadlines, and required documents
   must come from the actual job post or official admissions page. If not found,
   say "not found" and show the source checked.
3. **Human approval before sending.** Pause on a review screen before any email
   is sent or form submitted. Auto-apply is allowed only after this check.
4. **Everything is recorded.** Every application is saved automatically.
5. **Start small.** Build the most valuable parts first, add the rest in stages.

## 7. Application routes

| Route | When used | What Pathfolio does |
| --- | --- | --- |
| **A. Email** | The posting lists an application email | Writes the email, attaches tailored documents, sends or saves as draft |
| **B. Online form** | The posting links to a web form | Opens the page, fills details, uploads documents, answers questions, pauses before Submit |
| **C. Guided steps** | No email/simple form found, or a portal (typical for schools) | Gives a numbered guide: which site/page to open, which buttons, which documents to prepare |

## 8. Architecture

Web-first with Next.js 15 (App Router) + React 18 + TypeScript. Modular by
feature so no file exceeds about 500 lines.

```
src/
  app/                    # Next.js App Router routes + api/ handlers
  components/             # UI components (shadcn/ui + Tailwind)
  lib/
    db/                   # Drizzle connection, schema, migrations
    jobs/                 # in-process job runner + polling UI
    services/
      profile/            # master profile + reusable answers
      search/             # job/program search + match scoring
      tailoring/          # AI document generation + change review
      apply/              # route detection, email, forms, guides
      tracker/            # application records, filters, export
      reminders/          # deadlines and follow-ups
    integrations/
      llm/                # OpenRouter client (swappable)
      email/              # Nodemailer / Gmail API
      search-apis/        # Adzuna, Jooble, Remotive, Greenhouse, Lever
      browser/            # Cheerio (Playwright local-only via env flag)
    utils/
tests/                    # unit tests, mirroring lib/
drizzle.config.ts
.env.example              # template for local env vars
```

## 9. Tech stack

| Part | Choice |
| --- | --- |
| Language | TypeScript |
| Framework | Next.js 15 (App Router), React 18 |
| AI | OpenRouter (LLM API for tailoring, summarizing, writing) |
| Form filling | Guided steps (Playwright local-only via `ENABLE_PLAYWRIGHT` env flag) |
| Reading web pages | Cheerio |
| Email | Nodemailer or Gmail API |
| Database | Postgres via Drizzle ORM (Vercel store `fullstack`) |
| CV files | pdf-parse, mammoth, docx (stored in Postgres, no blob storage v1) |
| Hosting | Vercel (serverless functions, edge network) |
| Interface | Web-only (no CLI in v1) |

**Job data sources:** public job APIs (Adzuna, Jooble, Remotive) and public
Greenhouse and Lever job board interfaces. Avoid scraping large job sites
(fragile and may violate terms). Coverage differs by country — check regional
availability early.

## 10. Data model (simplified)

| Table | Main fields |
| --- | --- |
| `profile` | name, email, phone, links, summary, skills, education, experience, projects, saved answers |
| `opportunity` | type (job/school), title, organization, region, link, deadline, requirements, source |
| `application` | opportunity, date applied, method, status, contact email, notes, follow-up date |
| `document` | application, type (CV/cover letter/other), file path, version |
| `checklist_item` | application or school, document name, status, due date |
| `reminder` | application, date, message, done |

## 11. Risks and handling

| Risk | Handling |
| --- | --- |
| AI invents emails or requirements | Only extract from fetched pages; show source; else "not found" |
| AI adds false claims to the CV | Generate only from master profile; show a change review screen |
| Wrong answer in a form (salary, visa) | Ask the user; pause before Submit |
| Sites block automation or use CAPTCHAs | Prefer company career pages and email; fall back to guided steps |
| Platform terms of service | Avoid automating sites that forbid it, such as LinkedIn |
| Outdated school information | Always read from the current official page and link to it |
| Data loss | Regular export and backup of the SQLite file |
| Private data exposure | Keep all data local; protect API keys and email credentials |

## 12. Roadmap

| Phase | Deliverable |
| --- | --- |
| 1 | Master profile, paste a job description, get tailored CV and cover letter |
| 2 | Application tracker with duplicate warning and export |
| 3 | Job search by region and role type, with match score |
| 4 | Application email extraction and sending |
| 5 | Step-by-step guides and school document checklist |
| 6 | Playwright form filling with review before submit |
| 7 | School search, deadline reminders, inbox matching, interview prep |

## 13. Success measures

- Time to prepare a tailored application is under 10 minutes.
- Zero invented facts or contacts in generated documents.
- 100% of applications appear in the tracker.
- No duplicate applications sent by accident.
- No missed school deadlines.

## 14. Open questions

- Which regions and countries should be supported first?
- Which job APIs have the best coverage for those regions?
- Which email provider will be used for sending (Gmail or other)?
- Which schools or programs are the first targets?
- Should the interface stay CLI, or move to a local web page early?
