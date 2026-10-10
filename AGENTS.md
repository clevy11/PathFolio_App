# AGENTS.md — Working agreement

Golden Rules for AI-assisted development on Pathfolio. Treat these as binding.

## Project memory

- Read [PLANNING.md](./PLANNING.md) at the start of any new conversation.
- Keep [README.md](./README.md), `PLANNING.md`, and `TASK.md` current. Update
  `TASK.md` as work progresses: mark items done and add anything discovered.
- Do not duplicate scope in code comments; keep the docs as the source of truth.

## Golden Rules

1. **Manage the project with markdown.** `README.md`, `PLANNING.md`, `TASK.md`
   are the project memory.
2. **Keep files under 500 lines.** Split into modules when a file grows.
3. **One task per message.** Don't overload the model; do one thing well.
4. **Start fresh conversations often.** Long threads degrade quality.
5. **Test early, test often.** Every new function gets unit tests.
6. **Be specific.** More context and examples produce better results.
7. **Write docs and comments as you go.** Don't delay documentation.
8. **Handle environment variables yourself.** Never ask the LLM to put API keys
   or credentials in code; use env vars and a local, gitignored `.env`.

## Product principles (must be enforced in code)

- Never invent facts, contacts, emails, deadlines, or requirements. Extract only
  from fetched pages, always show the source, else return "not found".
- Generate documents only from the master profile.
- Human approval before any send or submit; pause before Submit.
- Ask the user instead of guessing on sensitive/unclear questions.
- Keep all data local; never log or commit secrets.

## Engineering conventions

- Language: Node.js with TypeScript. Tests mirror `src/` under `tests/`.
- Prefer small, single-purpose modules under `lib/services/` and
  `lib/integrations/`.
- **Server/client boundary:** all data access, file ops, and browser automation
  run in **server components / API routes** (`runtime = "nodejs"`). Client
  components only for interactive UI; never import `lib/db/`, `lib/integrations/browser/`,
  or Node-only libs in client code.
- **Database:** Drizzle ORM + Postgres (Vercel store `fullstack`). Migrations via
  `drizzle-kit`. Schema in `lib/db/schema.ts`.
- **Hosting:** Vercel. All deployments target Vercel; `vercel.json` not needed
  (defaults work). Static IPs / Secure Compute not used in v1.
- **Playwright:** disabled on Vercel; local-only via `ENABLE_PLAYWRIGHT` env flag.
  Never import `playwright` in code paths that run on Vercel.
- **AI/LLM:** OpenRouter behind `lib/integrations/llm/` service interface.
  Provider is swappable; never hard-code model names outside the wrapper.
- Do not add comments unless they add real value.
- Do not commit unless explicitly asked. Never commit secrets.

## Workflow

- Before starting a task, confirm the plan and check `TASK.md` for the relevant
  item.
- After finishing a task, update `TASK.md`, run lint and tests, and report what
  was verified.
