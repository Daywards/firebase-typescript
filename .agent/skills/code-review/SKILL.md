---
name: Code Review
description: Conducts a comprehensive code review focusing on project standards and code quality.
---

# Code Review Skill

This skill guides you through conducting a thorough code review. It ensures that all changes adhere to the project's strict standards as defined in `AGENTS.md` (specifically **Section 5: Coding Standards & Guardrails**) and pass all automated quality checks.

## usage

Use this skill when the user asks for a "code review", "review my changes", "check my code", or before submitting a PR.

## Instructions

1.  **Contextualize & Validate**:
    - **Read `AGENTS.md`**: Before reviewing any code, you **MUST** read the `AGENTS.md` file in the root of the repository to refresh your memory on the specific coding standards, architectural guidelines, and tech stack versions (e.g., TypeScript strictness, Zod usage, specific frameworks). Pay close attention to **Section 3 (Tech Stack)** and **Section 5 (Coding Standards)**.
    - **Run Automated Checks**: Execute the validation script to catch linting and type errors early.
        ```bash
        pnpm run validate
        ```

        - If `validate` is not available, run `pnpm run lint` and `pnpm run typecheck` individually.
        - _Note any failures directly in your review._

2.  **Analyze the Changes**:
    - Review the code changes (git diff or specific files provided).
    - **TypeScript Rules** (from `AGENTS.md` **Section 5: TypeScript Rules**):
        - **Strict Mode**: Always check for strict null checks and no implicit any.
        - **No `any`**: Ensure `unknown` or narrower types are used; flag usage of `any`.
        - **Interfaces**: Ensure `interface` is used for public API contracts and component props.
        - **Zod**: Verify Zod is used for all runtime validation (env vars, API inputs).
        - **Scripts**: Check that scripts in `scripts/` are `.ts` and run with `tsx`.
    - **Code Style** (from `AGENTS.md` **Section 5: Code Style**):
        - Indentation: 4 spaces.
        - Semicolons: Always used.
        - Quotes: Single quotes.
        - Trailing Commas: All.
    - **Monorepo Safety** (from `AGENTS.md` **Section 5: Monorepo Safety**):
        - **Imports**: Deeply import from `packages/ui` only if allowed by exports. Prefer main entry.
        - **Env Vars**: Ensure no `.env` files are committed.
    - **Tech Stack Alignment** (from `AGENTS.md` **Section 3: Tech Stack & Versions**):
        - Verify usage of Node 22, Next.js 16, React 19, and Firebase Admin v12/Functions v2.

3.  **Generate the Review**:
    - Structure your review clearly.
    - **Summary**: A high-level overview of the health of the changes.
    - **Automated Checks**: Report the status of `pnpm run validate`.
    - **Critical Issues**: Any violations of `AGENTS.md` or bugs.
    - **Suggestions**: Improvements for readability, performance, or strictness.
    - **Nitpicks**: Minor style preference points (if any).

4.  **Formatting**:
    - Use Markdown.
    - Use code blocks for examples.
    - Be constructive and reference specific sections of `AGENTS.md` when pointing out violations.
