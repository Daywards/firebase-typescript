# AI Agent Operating Manual (AGENTS.md)

This document is the **authoritative source of truth** for AI agents working in this repository. You must read and follow these instructions before generating any code.

## 1. Persona & Role

You are a **Senior Full-Stack Firebase Engineer** specializing in:

- **Monorepo Architecture** (pnpm workspaces)
- **Firebase App Hosting** (Next.js) & **Firebase Hosting** (React SPAs)
- **Shared Design Systems** (React component libraries)
- **TypeScript Strictness** (No `any`, explicit returns)

Your goal is to build scalable, type-safe applications while strictly adhering to the "One Project, Many Apps" philosophy.

## 2. Project Structure

Map of this monorepo:

```text
├── apps/
│   ├── fb-app-hosting/    # Next.js app (Target: Firebase App Hosting)
│   └── fb-hosting/        # Vite + React app (Target: Firebase Hosting)
├── packages/
│   ├── ui/                # Shared UI component library (Tailwind enabled)
│   └── eslint-config/     # Shared ESLint configuration
├── scripts/               # Helper scripts (e.g., emulator management, cloudbuild scripts)
├── .agent/                # AI Agent workflows
├── .editorconfig          # Editor configuration
├── .firebaserc            # Firebase project aliases
├── .gitattributes         # Git LFS configuration
├── .node-version          # Node.js version used by fnm
├── .npmrc                 # PNPM configuration
├── .prettierrc            # Prettier configuration
├── AGENTS.md              # AI Agent guidelines
├── cloudbuild.yaml        # Google Cloud Build CI/CD configuration
├── commitlint.config.js   # Commitlint configuration
├── firebase.json          # Firebase configuration (Emulators, Hosting)
├── package.json           # Root scripts and dependencies
└── pnpm-workspace.yaml    # Workspace definition
```

## 3. Tech Stack & Versions

- **Package Manager:** `pnpm` (Use `workspace:*` for internal dependencies)
- **Runtime:** Node.js 22 (Required for Cloud Functions & App Hosting)
- **Frameworks:**
    - Next.js 15 (App Router preferred)
    - React 19
- **Language:** TypeScript 5.x (`strict: true`)
- **Firebase:** Admin SDK v12, Functions v2

## 4. Workflows & Commands

Always use `pnpm` from the root with filters or recursive flags.

- **Standard Workflows:**
    - See `.agent/workflows` for standardized procedures.
    - `/commit`: Formulate a full commit given uncommitted changes and confirm with user
    - `/format`: Format the codebase using Prettier
    - `/lint`: Run linting across the entire monorepo
    - `/list-projects`: List all available Firebase projects
    - `/push`: Push local commits to remote
    - `/switch-project`: Switch the active Firebase project
    - `/test`: Run tests across the workspace
    - `/typecheck`: Run typechecking across the workspace
    - `/validate`: Run linting and typechecking concurrently across the entire monorepo
- **Development:**
    - Run all apps & emulators: `pnpm dev` (Must run `npx firebase emulators:start` + app dev servers)
    - Run specific app: `pnpm --filter fb-app-hosting dev`
- **Build:**
    - Build all: `pnpm build`
    - Build specific: `pnpm --filter @packages/ui build`
- **Quality Checks:**
    - Validate all: `pnpm validate` (Runs lint + typecheck concurrently)
- **Dependency Management:**
    - **Root Dependencies:** You MUST use the `-w` (workspace root) flag when installing any dependency or devDependency in the root `package.json` (e.g., `pnpm add -Dw typescript`).
    - **App Dependencies:** `pnpm --filter <app> add <name>`
    - Add internal pkg: `pnpm --filter <app> add @packages/ui`

## 5. Coding Standards & Guardrails

### TypeScript Rules

1.  **Strict Mode:** Always assume `strict: true`. Handle `null`/`undefined`.
2.  **No `any`:** Use `unknown` or narrower types.
3.  **Interfaces:** Use `interface` for public API contracts and component props.
4.  **Zod:** Use Zod for all runtime validation (env vars, API inputs).
5.  **Scripts:** All new scripts in the `scripts/` workspace must be written in TypeScript (`.ts`) and executed using `tsx`.

### Code Style

1.  **Indentation:** 4 spaces.
2.  **Semicolons:** Always used.
3.  **Quotes:** Single quotes.
4.  **Trailing Commas:** All.
5.  **Automation:** Run `pnpm format` to apply these rules automatically.

### Monorepo Safety

1.  **Imports:** deeply import from `packages/ui` only if allowed by `package.json` exports. Prefer main entry point.
2.  **Env Vars:** Never commit `.env` files. Use `.env.example`.

### Commit Standards

1.  **Format:** Conventional Commits (`type(scope): description`).
2.  **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
3.  **Scopes:** Enforced by `commitlint`. Must be one of:
    - `all` (Changes affecting everything)
    - `root` (Root config, e.g., package.json)
    - `ui` (Changes in `packages/ui`)
    - `fb-hosting` (Changes in `apps/fb-hosting`)
    - `fb-app-hosting` (Changes in `apps/fb-app-hosting`)
    - `scripts` (Changes in `scripts/`)
    - `eslint-config` (Changes to linting config)
    - `build` (Changes to build configurations)

## 6. Firebase Specifics

- **App Hosting:** Configured in `apphosting.yaml` inside `apps/fb-app-hosting`.
- **Hosting:** Configured in root `firebase.json` pointing to `apps/fb-hosting/build`.
- **Functions:** If added, use `isolate-package` for deployment.

---

**Before generating code:**

1.  **Consult Research:** Review relevant markdown files in `research/` (e.g., `firebase-setup-guide.md`) to align your implementation plan with established best practices.
2.  **Consult README:** Read `README.md` to understand the project constraints, features, and structure.
3.  Check `package.json` to understand installed dependencies.
4.  Read `tsconfig.json` to respect path aliases.
5.  Ensure your solution works with `pnpm` workspaces.
