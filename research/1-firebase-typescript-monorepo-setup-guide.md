# Firebase Setup & Agent Best Practices Guide

This guide consolidates best practices for configuring a Firebase monorepo, guiding AI coding agents, and enforcing TypeScript standards.

---

## Part 1: Monorepo & Firebase Configuration

### 1. The Purpose of AGENTS.md

`AGENTS.md` serves as a **"README for AI Agents."** Its goal is to provide context, constraints, and operating instructions that ensure AI-generated code aligns with project standards, architecture, and workflows.

### 2. Core Agent Persona

Instead of generic prompts, define a specific role for the agent.

- **Example:** "You are a senior full-stack engineer specializing in Firebase, React, Next.js, and TypeScript. You prioritize type safety, modular design, and efficient Cloud Functions."

### 3. The Operating Manual

Provide concrete instructions and examples.

- **Executable Commands:** List exact commands for building, testing, and deploying.
    - `pnpm run build`
    - `pnpm test`
    - `npx firebase deploy --only functions`
- **Code Examples:** Show, don't just tell. specific patterns for:
    - Firebase Function triggers (v2 vs v1)
    - Firestore data modeling (converters, types)
    - React component structure
- **Tech Stack:** Be explicit about versions.
    - Node.js 22 (LTS)
    - Firebase Admin SDK v12
    - React 18/19
    - TypeScript 5.x

### 4. Explicit Boundaries ("Never Do")

Prevent common mistakes by setting hard boundaries.

- **Safety:** "Never commit `.env` files."
- **Architecture:** "Never import directly from `src/components` in backend code."
- **Style:** "Never use `any`; use `unknown` or specific types."
- **Logic:** "Do not modify the `gcp-build` script without verification."

### 5. Monorepo Specifics (Firebase + pnpm)

Monorepos require special attention to navigation and dependencies.

- **Hierarchical Context:** Place a root `AGENTS.md` for global rules and nested `AGENTS.md` files in packages (e.g., `functions/AGENTS.md`, `webapp/AGENTS.md`) for specific context.
- **Workspace Protocol:** Instruct the agent to use pnpm's `workspace(*)` protocol for internal dependencies.
    - _Rule:_ "Always use `workspace:*` for internal package versions in `package.json`."
- **Project Structure (`STRUCTURE.md`):** Consider a separate file or section mapping the monorepo layout.
    ```text
    /
    ├── packages/
    │   ├── common/       # Shared types and utilities
    │   └── ui/           # Shared UI components
    ├── apps/
    │   └── web/          # Next.js/React app
    ├── functions/        # Firebase Cloud Functions
    ├── pnpm-workspace.yaml
    ├── firebase.json
    ├── package.json      # Root package.json
    ├── commitlint.config.js
    └── eslint.config.js
    ```

### 6. Firebase App Hosting & Functions in a Monorepo

When using both App Hosting (Next.js/Angular) and Cloud Functions (2nd Gen) in a pnpm monorepo, distinct strategies are required.

#### App Hosting (Native Monorepo Support)

Firebase App Hosting is designed to work with monorepos.

- **Root Directory:** Configure `rootDir` in `apphosting.yaml` or the Firebase console to point to the specific application (e.g., `apps/web`).
- **Workspace Protocol:** It understands `workspace:*` dependencies.
- **Build Command:** Use `apphosting.yaml` to specify build commands, usually filtering by the package:
    ```yaml
    scripts:
        buildCommand: pnpm --filter web build
    ```

#### Cloud Functions (Isolated Environment)

Cloud Functions deployments isolate the `functions` directory, breaking pnpm workspace links to local packages.

- **The Problem (Hoisting & Isolation):** Deployed functions run in an entirely isolated environment. They cannot "reach up" to the monorepo root to resolve `node_modules` or `workspace:*` dependencies (e.g., `@repo/ui`, `@repo/db`). This requires all code to be strictly self-contained (bundled or packed) within the `functions` directory.
- **The Solution: Use `isolate-package` (Recommended)**
  `isolate-package` automatically creates a temporary, self-contained implementation of your function package with all local workspace dependencies resolved and copied into it.

    **Automated Integration (Best for most users)**
    Use `firebase-tools-with-isolate`, a fork that wraps the standard CLI.
    1.  **Install:** `pnpm add -D firebase-tools-with-isolate` at root.
    2.  **Config:** Update `firebase.json` usage to deploy via this tool or alias it in scripts.
    3.  **Deploy:** When you run `npx firebase deploy`, it automatically isolates the function package before uploading.

    _Note: This is significantly more robust than manual `npm pack` strategies._

#### pnpm Specifics

- **Shamefully Hoist:** You may need `shamefully-hoist=true` in `.npmrc` if you encounter phantom dependency issues, though strict pnpm usage is preferred.
- **Engines:** Explicitly set package management in `package.json`:
    ```json
    "engines": {
      "node": "20",
      "pnpm": "9"
    },
    "packageManager": "pnpm@9.x.x"
    ```

### 7. Root `firebase.json` Configuration

The root `firebase.json` orchestrates the monorepo's deployment targets.

- **`apphosting` Array:** Maps local directories to App Hosting backends.

    ```json
    "apphosting": [
      {
        "backendId": "my-nextjs-app",
        "rootDir": "apps/web"
      },
      // ...
    ]
    ```

    _Note: Runtime settings (CPU, memory) are NOT set here; use `apphosting.yaml` in the respective `rootDir`._

- **`hosting` Array:** Manages standard Firebase Hosting sites (static assets or rewrites).
    ```json
    "hosting": [
      {
        "target": "marketing-site",
        "public": "apps/landing/dist",
        "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
        "rewrites": [
          {
            "source": "/api/**",
            "function": "api"
          },
          {
            "source": "**",
            "destination": "/index.html"
          }
        ]
      }
    ]
    ```

### 8. Root `package.json` Best Practices

The root `package.json` should strictly manage the _repository_, not the _application logic_.

- **Private:** Always set `"private": true`.
- **Workspaces:** Define your workspace layout.
    ```json
    "workspaces": [
      "apps/*",
      "packages/*",
      "functions/*"
    ]
    ```
- **Scripts:** Delegate commands using `pnpm -r` (recursive) or `--filter`.
    - `"dev": "pnpm -r run dev --parallel"`
    - `"build": "pnpm -r run build"`
    - `"deploy:functions": "npx firebase deploy --only functions"`

### 9. Git Guardrails & Conventional Commits

Strict git practices are essential for automated release pipelines and changelogs.

- **Commitlint:** Enforce Conventional Commits (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `ci`, `perf`).
    - **Monorepo Scopes:** Configure `commitlint` to require scopes matching the monorepo structure (e.g., `feat(ui): button component`, `fix(api): user auth`).
- **Husky:** Use `husky` to run `commitlint` on `commit-msg` hook.

### 10. Asking Agents for Commits

When asking an LLM to generate commits:

- **Prompt:** Ask for specific format `<type>(<scope>): <subject>` and strict line length (72 chars).
- **Filtering:** Instruct LLM to ignore lockfile and whitespace changes.

### 11. Using Firebase MCP Server

- **Discovery:** Agents should use `list_resources` to find available guides.
- **Initialization:** Use MCP tools (`mcp_firebase_backend_init`, etc.) instead of raw CLI when possible.
- **Context:** Use `mcp_firebase_read_resource` to read configs before proposing changes.

---

## Part 2: TypeScript Guardrails & Code Style

When instructing AI agents to generate or modify TypeScript code, strict guardrails are essential to ensure type safety, consistency, and correctness.

### 1. Strict Mode & Code Quality

- **Enforce `strict: true`**: The agent must assume `strict` mode is enabled in `tsconfig.json`. Code should strictly handle `null` and `undefined`.
- **No Implicit `any`**: The agent must absolutely avoid `any`. Use `unknown` with narrowing if the type is truly dynamic.
- **Explicit Returns**: Function return types should be explicit, not inferred, especially for public APIs and exported functions. This acts as a clear contract for the AI's logic.

### 2. Type Definitions vs. Interfaces

- **Prefer Interfaces for Objects**: Use `interface` for defining object shapes and public API contracts. They are extensible and provide better error messages.
- **Use Types for Unions/Intersections**: Use `type` for complex unions, intersections, or primitives aliases.
- **Exported Types**: Ensure all types used in public signatures are exported.

### 3. Runtime Validation (Zod)

- **Zod as Source of Truth**: When handling external data (API responses, user input, config), use Zod schemas.
- **Inferred Types**: Derive static types from Zod schemas using `z.infer<typeof schema>` to keep runtime validation and static types in sync.
    ```typescript
    const UserSchema = z.object({ id: z.string(), name: z.string() });
    type User = z.infer<typeof UserSchema>;
    ```

### 4. AI-Specific Instructions

- **"No Hallucinated Types"**: The agent must verify that imported types actually exist. It should not invent properties on existing types without ensuring they are defined.
- **Context Awareness**: When modifying existing files, the agent should first read the imports to reuse existing types rather than creating duplicates.
- **Async/Await**: The agent should prefer `async/await` over promise chains for readability and better error handling in try/catch blocks.

### 5. Error Handling

- **Typed Errors**: Since TypeScript doesn't strongly type `catch(e)`, the agent should use type guards or utility functions (e.g., `isError(e)`) before accessing properties on the error object.

### 6. Code Style & Formatting

- **Import Organization**:
    - **Group 1**: Node.js built-ins (`fs`, `path`).
    - **Group 2**: External dependencies (`react`, `firebase`).
    - **Group 3**: Project internals (`@/components`, `./utils`).
    - **Group 4**: Style/CSS imports.
    - _Sorting_: Alphabetical order within groups.
- **No Shorthand Control Flow**: Always use braces for control flow statements (`if`, `for`, `while`), even for single-line blocks.
    - _Bad_: `if (isValid) return;`
    - _Good_: `if (isValid) { return; }`
- **Stroustrup Brace Style**: Enforce "Stroustrup" style braces (ESLint `brace-style: "stroustrup"`).
    - Opening brace on the **same line** as the statement.
    - `else`, `catch`, `finally` must be on their own **new line**.
    - _Example_:
        ```typescript
        if (condition) {
            // ...
        } else {
            // ...
        }
        ```

### 7. ESLint & Automated Feedback

- **The Feedback Loop**: Agents should be instructed to run `pnpm run lint` (or equivalent) after generating code and _before_ asking for user review. If errors occur, the agent must fix them iteratively.
- **High-Value Rules for Agents**:
    - `no-unused-vars`: Prevents accumulation of dead code which confuses future context.
    - `eqeqeq`: Enforces strict equality, reducing subtle logic bugs.
    - `no-shadow`: Prevents variable naming collisions that can trick the agent's context awareness.
    - `@typescript-eslint/explicit-module-boundary-types`: Ensures public API contracts are clear (reinforcing the "Explicit Returns" rule).
- **Ignoring Noise**: Instruct the agent to ignore lint errors in files marked as "generated" (e.g., GraphQL types, build artifacts) unless it was specifically tasked to regenerate them.

### 8. Commenting Strategy

- **"Why" > "What"**: Comments should explain the _intent_ and _business logic_ behind complex blocks, not mere translation of code.
    - _Bad_: `// Filter users by active status`
    - _Good_: `// Only active users can receive notifications per policy X`
- **JSDoc for Contracts**: Use JSDoc (`/** ... */`) for all exported functions, interfaces, and classes. Include `@param` and `@returns` to help the agent contextually understand usage later.
- **Inline Comments**: Use `//` for implementation details _inside_ function bodies.
- **TODOs**: Agents should use a structured format for TODOs:
    - `// TODO(agent): Refactor this to use X pattern`
    - `// FIXME: Handle edge case Y`
- **No Redundancy**: Do not add comments that simply repeat the variable name or logic (e.g., `const x = 1; // assign 1 to x`).
