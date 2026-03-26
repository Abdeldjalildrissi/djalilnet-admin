# Agent Instructions

Read this entire file before starting any task.

## Self-Correcting Rules Engine

This file contains a growing ruleset that improves over time. **At session start, read the entire "Learned Rules" section before doing anything.**

### How it works

1. When the user corrects you or you make a mistake, **immediately append a new rule** to the "Learned Rules" section at the bottom of this file.
2. Rules are numbered sequentially and written as clear, imperative instructions.
3. Format: `N. [CATEGORY] Never/Always do X — because Y.`
4. Categories: `[STYLE]`, `[CODE]`, `[ARCH]`, `[TOOL]`, `[PROCESS]`, `[DATA]`, `[UX]`, `[OTHER]`
5. Before starting any task, scan all rules below for relevant constraints.
6. If two rules conflict, the higher-numbered (newer) rule wins.
7. Never delete rules. If a rule becomes obsolete, append a new rule that supersedes it.

### When to add a rule

- User explicitly corrects your output ("no, do it this way")
- User rejects a file, approach, or pattern
- You hit a bug caused by a wrong assumption about this codebase
- User states a preference ("always use X", "never do Y")

### Rule format example

```
14. [CODE] Always use `bun` instead of `npm` — user preference, bun is installed globally.
15. [STYLE] Never add emojis to commit messages — project convention.
16. [ARCH] API routes live in `src/server/routes/`, not `src/api/` — existing codebase pattern.
```

---

## Learned Rules

<!-- New rules are appended below this line. Do not edit above this section. -->

1. [CODE] Use Next.js 15/16 + React 19 + Tailwind CSS v4 conventions for consistent UI developments.
2. [ARCH] Centralize business logic in high-performance "Service" classes (e.g., ContactService, EmailService) located in `src/services/`.
3. [STYLE] Use the `@/` path alias for all internal imports to maintain clean and relocatable module references.
4. [CODE] Leverage Drizzle ORM for all database interactions; avoid raw SQL where schema-safe functions are available.
5. [UX] Prefer glassmorphism and modern dark-mode aesthetics (Slate/Zinc palettes) for admin dashboad components.
6. [CODE] When testing authentication scripts, be mindful of rate limiting (429 errors). Automated test logins should be minimized to avoid triggering security blocks.
7. [TOOL] Better Auth is the primary authentication provider; manage user accounts and sessions through its internal hooks and API endpoints. 
8. [PROCESS] This rulebook (GEMINI.md) is the source of truth for all projects. The AI must proactively scan and update it at the start and end of every task to reflect new learnings or user corrections.
9. [TOOL] Multi-agent debate skill is installed in `@/model-chat-skill`. Trigger with "model chat" or "/model-chat" to spawn a debate between 5+ Claude instances for complex decision-making.
10. [PROCESS] Use "Prompt Contracts" (GOAL, CONSTRAINTS, FORMAT, FAILURE) for complex architectural tasks to define success and failure upfront.
11. [PROCESS] Use "Reverse Prompting" before starting ambiguous tasks—ask exactly 5 clarifying questions to surface assumptions.
12. [ARCH] Use "Multi-Agent MCP Orchestration" patterns when delegating work across specialized MCP servers (e.g., StitchMCP for UI, Firebase for DB).
13. [CODE] Always prefer `UploadButton` from `@uploadthing/react` for image uploads in the admin dashboard to maintain consistency with existing media infrastructure.
14. [UX] When implementing text editors (Markdown or Rich Text), prioritize cursor-aware insertion over appending to ensure a natural writing flow.
15. [UX] In the blog frontend, if double titles occur (template H1 + content H1), always strip the first H1 tag from the content HTML using a regex-based approach.
16. [PROCESS] Always run `npm run build` in affected project directories before suggesting or performing a production deployment to verify build stability.
17. [CODE] When increasing rate limits for security-sensitive paths (e.g., auth), document the reasoning and ensure it aligns with the expected user load and security posture.
18. [CODE] Implement multi-layered title stripping for the blog: use regex-based stripping in API handlers (POST/PATCH) to clean the database, and `prose-h1:hidden` (or equivalent) in the frontend for visual safety.
19. [PROCESS] Automatically append new technical learnings and user-requested constraints to `GEMINI.md` at the end of every significant task without being prompted.
20. [STYLE] For long-form blog content, maintain a high-readability typography scale: use `prose-xl` (20px) as the base and `md:prose-2xl` (24px) for desktop viewports.
