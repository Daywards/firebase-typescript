---
description: Formulate a full commit given uncommitted changes and confirm with user
---

1. Run `git status` to see the state of the working directory.
2. Run `git diff` (and/or `git diff --cached`) to analyze the specific code changes.
3. Formulate a commit message that:
    - Follows Conventional Commits format (`type(scope): description`).
    - **MUST** use one of the following allowed scopes based on the files changed:
        - `root`: Changes to root-level files (e.g. `pnpm-workspace.yaml`, `.gitignore`, `README.md`) that do not affect specific packages.
        - `ui`: Changes within `packages/ui`.
        - `fb-hosting`: Changes within `apps/fb-hosting`.
        - `fb-app-hosting`: Changes within `apps/fb-app-hosting`.
        - `eslint-config`: Changes within `packages/eslint-config`.
        - `scripts`: Changes within `scripts`.
        - `build`: Changes to build configurations (e.g. `cloudbuild.yaml`, `Dockerfile`).
        - `all`: Changes that cross multiple scope boundaries (e.g., a refactor affecting both `ui` and `fb-hosting`, or a repo-wide configuration change).
    - Accurately reflects the changes.
    - **MUST** keep the header (first line) and body lines under 100 characters.
    - Is concise but descriptive.
    - Includes a detailed body paragraph if the change warrants explanation. Use details from the current session (user requests, `task.md`, `implementation_plan.md`, or recent conversation context) to explain _why_ the changes were made, not just _what_ changed.
4. **CRITICAL**: Present the proposed commit command (e.g., `git commit -m "..."`) to the user using the `run_command` tool, but ensure `SafeToAutoRun` is set to `false` so the user must explicitly approve it.
    - Alternatively, you can propose the message in text first if the logic is complex, but proposing the command directly with `SafeToAutoRun: false` is preferred for efficiency if you are confident.
5. If the user rejects or asks for changes, refine the message and try again.
