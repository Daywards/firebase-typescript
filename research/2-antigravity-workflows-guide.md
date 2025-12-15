# Antigravity Workflows Research

## What are Antigravity Workflows?

Antigravity workflows are a standardized way to define reusable, step-by-step procedures for AI agents to follow. They are stored as Markdown files in the `.agent/workflows` directory.

### Structure

Each workflow file (e.g., `.agent/workflows/deploy.md`) follows this format:

```markdown
---
description: [short title, e.g. how to deploy the application]
---

1. [Step 1 instruction]
2. [Step 2 instruction]
```

### Key Features

1.  **YAML Frontmatter**: Contains metadata like `description`.
2.  **Slash Commands**: Workflows can be referenced by the user explicitly (e.g., if a file is named `deploy.md`, the user might refer to it via `/deploy` or similar intent).
3.  **Turbo Mode (Auto-Run)**:
    - `// turbo`: Placed above a specific step to indicate that the _next_ `run_command` can be auto-ran (`SafeToAutoRun: true`).
    - `// turbo-all`: Placed anywhere in the file to indicate that _ALL_ `run_command` steps in the workflow are safe to auto-run.

### Usage

To create a new workflow:

1.  Create a file in `.agent/workflows/[filename].md`.
2.  Define the `description` in the frontmatter.
3.  List the specific steps to be executed.

These workflows allow the agent to reliably repeat complex tasks (like deployment, setup, or specific refactors) with consistent behavior and optional automation.

## Best Practices for Firebase TypeScript Projects

To maximize the effectiveness of Antigravity workflows in this specific tech stack (Firebase, TypeScript, pnpm Monorepo), adhere to the following best practices:

### 1. Naming Conventions Strategy

- **Verb-Object Pattern**: Name workflows as `verb-object.md` (e.g., `deploy-staging.md`, `check-types.md`).
- **Slash-Command Optimization**: Choose filenames that make intuitive slash commands.
    - `deploy.md` -> `/deploy`
    - `test.md` -> `/test`
    - `scaffold.md` -> `/scaffold`

### 2. Safety & "Turbo" Usage

- **Turbo-All for RO**: Use `// turbo-all` for read-only workflows (e.g., status checks, linting) or local scaffolding that doesn't risk data loss.
- **Manual Approval for Ops**: DO NOT use `// turbo` for deployment or destructive database operations. Always require user confirmation for `firebase deploy` or `firebase functions:delete`.
- **Pre-Flight Checks**: Every workflow should start by verifying constraints (e.g., "Am I in the root?", "Is the emulator running?").

### 3. Contextual Integration

- **Package Manager Awareness**: Always use `pnpm` filters (`pnpm --filter <app>`) instead of `cd`ing into directories. This preserves the root workspace context.
- **Firebase Awareness**:
    - Use `firebase use <project>` to ensure the correct environment target before operations.
    - Check for `firebase-tools` presence or suggest `pnpm add -g firebase-tools`.

### 4. Standard Workflows (Templates)

#### A. Component Scaffolding (`.agent/workflows/scaffold-component.md`)

Enforces the "Shared Design System" standard by scaffolding into `packages/ui` correctly.

```markdown
---
description: Create a new shared UI component
---

1. Ask user for Component Name (PascalCase)
2. Create directory `packages/ui/src/components/[ComponentName]`
3. Create `packages/ui/src/components/[ComponentName]/index.tsx` with standard React + Type boilerplate.
4. Export the new component in `packages/ui/src/index.ts`
   // turbo
   `# edit packages/ui/src/index.ts to add export`
5. Run generic build to verify
   // turbo
   `pnpm --filter @packages/ui build`
```

### 5. Documentation Maintenance

- Treat workflows as code. If `package.json` scripts change, update the corresponding workflows.
- Add a section in `AGENTS.md` referencing these workflows so future agents know they exist (e.g., "See `.agent/workflows` for standard procedures").

### 6. Resource Types: Guides vs. Tools

The `firebase-mcp-server` exposes two primary capability types for building workflows. Understanding the distinction is key to designing effective Antigravity interactions.

#### A. Guides (Informational)

Guides are static markdown resources (e.g., `firebase://guides/init/hosting`) found in the `resources` list.

- **Purpose**: Provide human-readable context and documentation.
- **Usage**: Useful for "passive" workflows where the agent retrieves instructions for the user to read or simple "read-and-run" scripts.
- **Limitation**: They do not facilitate active state management or automation by the agent itself.

#### B. Tools (Executable)

Tools are executable functions (e.g., `firebase_create_project`, `firestore_query_collection`) that allow the agent to interact directly with Firebase services.

- **Purpose**: Enable active management, deployment, and debugging.
- **Usage**: The building blocks for high-value "Tool-Based Workflows".
- **Recommendation**: Prioritize **Tool-Based Workflows** (Section 7) over simple Guide display. Tools allow the agent to validate state, handle errors, and chain complex actions.

| Guide Resource Example             | Equivalent Tool-Based Capability | Advantage of Tool Approach                                   |
| :--------------------------------- | :------------------------------- | :----------------------------------------------------------- |
| `firebase://guides/init/backend`   | **A. Project Initialization**    | Agent provisions resources directly; less context switching. |
| `firebase://guides/init/firestore` | **K. Firestore Management**      | Agent can actively seed data and verify rules.               |
| `firebase://guides/init/hosting`   | **F. App Hosting Monitor**       | Agent polls deployment status in real-time.                  |

Use the **Advanced Tool-Based Workflows** below as the standard architectural pattern for this project.

### 7. Advanced Tool-Based Workflow Opportunities

Beyond the static initialization guides, the `firebase-mcp-server` provides a rich set of executable **Tools** that can be composed into powerful agentic workflows. Below is an analysis of these capabilities and how they can be standardized.

#### Project & Environment

**A. Project Initialization & Setup**
**Goal**: Bootstrap new projects and environments.

- **Tools**: `mcp_firebase-mcp-server_firebase_create_project`, `mcp_firebase-mcp-server_firebase_init`.
- **Potential Workflow (`/new-project`)**:
    1.  User requests a new project setup.
    2.  Agent calls `create_project` to provision resources on Google Cloud.
    3.  Agent calls `firebase_init` to enable specific services (Firestore, Auth, AI) in the workspace.

**B. Project Context Switching**
**Goal**: Safely switch between Firebase projects (e.g., staging vs. prod).

- **Tools**: `mcp_firebase-mcp-server_firebase_list_projects`, `mcp_firebase-mcp-server_firebase_update_environment`.
- **Potential Workflow (`/switch-project`)**:
    1.  Agent lists available projects.
    2.  User selects the target project ID.
    3.  Agent updates the active environment context.
    4.  Agent confirms the new active project.

**C. Environment Audit**
**Goal**: Verify local configuration and active user/project state.

- **Tools**: `mcp_firebase-mcp-server_firebase_get_environment`.
- **Potential Workflow (`/audit-env`)**:
    1.  Agent retrieves the current environment config.
    2.  Agent verifies: active user, project directory, active project ID.
    3.  Agent warns if "default" project is being used in a production context.

**D. Security Compliance (SMS)**
**Goal**: Enforce regional restrictions for SMS authentication.

- **Tools**: `mcp_firebase-mcp-server_auth_set_sms_region_policy`.
- **Potential Workflow (`/secure-sms`)**:
    1.  User requests to block SMS auth from high-risk regions.
    2.  Agent constructs a DENY list of country codes.
    3.  Agent applies the policy using `set_sms_region_policy`.

#### Applications & Hosting

**E. App Onboarding Automation**
**Goal**: streamline adding new platform targets to the project.

- **Tools**: `list_projects`, `firebase_create_app`, `firebase_create_android_sha`, `firebase_get_sdk_config`.
- **Potential Workflow (`/add-app`)**:
    1.  List existing apps to prevent duplicates.
    2.  Create new iOS/Android/Web app.
    3.  (Android) register SHA-1 for Auth/Dynamic Links.
    4.  Output the `google-services.json` or config object.

**F. App Hosting Rollout Monitor**
**Goal**: Track the status and logs of App Hosting deployments.

- **Tools**: `mcp_firebase-mcp-server_apphosting_list_backends`, `mcp_firebase-mcp-server_apphosting_fetch_logs`.
- **Potential Workflow (`/monitor-rollout`)**:
    1.  Agent lists App Hosting backends.
    2.  User selects the backend.
    3.  Agent fetches the latest build logs to check for errors.
    4.  Agent fetches runtime logs to verify traffic is serving.

**G. Cloud Run Deployment Pipeline**
**Goal**: Build and deploy containerized services to Cloud Run.

- **Tools**: `mcp_cloudrun_deploy_container_image`, `mcp_cloudrun_deploy_local_folder`, `mcp_cloudrun_list_services`.
- **Potential Workflow (`/deploy-service`)**:
    1.  User selects a local folder or image URL.
    2.  Agent lists existing services to confirm target.
    3.  Agent triggers deployment to the specified region/service.
    4.  Agent returns the service URL upon completion.

**H. Cloud Functions Debugging**
**Goal**: Real-time log monitoring for specific backend functions.

- **Tools**: `mcp_firebase-mcp-server_functions_get_logs`.
- **Potential Workflow (`/debug-functions`)**:
    1.  User specifies one or more function names.
    2.  Agent fetches recent logs with a `min_severity` (e.g., WARNING/ERROR).
    3.  Agent renders a summary of errors to help triage issues.

**I. Notification Testing (FCM)**
**Goal**: Verify push notification integration by sending test messages.

- **Tools**: `mcp_firebase-mcp-server_messaging_send_message`.
- **Potential Workflow (`/test-fcm`)**:
    1.  User provides a target (Registration Token or Topic).
    2.  User defines title and body content.
    3.  Agent sends the message using the MCP tool.
    4.  Agent confirms delivery status.

**J. Remote Config Management**
**Goal**: Safely roll out feature flags or configuration updates.

- **Tools**: `mcp_firebase-mcp-server_remoteconfig_get_template`, `mcp_firebase-mcp-server_remoteconfig_update_template`.
- **Potential Workflow (`/update-remote-config`)**:
    1.  Agent fetches the current active template.
    2.  Agent proposes a specific parameter update (e.g., enable a flag).
    3.  User validates the JSON patch.
    4.  Agent pushes the updated template (optionally handling rollback versions).

#### Databases & Storage

**K. Firestore Data Management**
**Goal**: Manage Firestore data lifecycle (Seeding, Cleanup, Inspection).

- **Tools**: `mcp_firebase-mcp-server_firestore_query_collection`, `mcp_firebase-mcp-server_firestore_get_documents`, `mcp_firebase-mcp-server_firestore_delete_document`.
- **Potential Workflow (`/seed-firestore`)**:
    1.  User provides seeding intent (e.g., "Create 10 test users").
    2.  Agent generates synthetic data matching the schema.
    3.  Agent writes documents (using a hypothesized `firestore_set_document` or multiple `firestore_create_document` calls via generic tools if specific ones aren't available, or falling back to `firebase-admin` script execution).
        _Note: The current toolset lists `delete` and `get`/`query`, but `set`/`add` might be limited. If direct write tools are missing, the agent can generate a seeding script and run it._

- **Potential Workflow (`/clean-firestore`)**:
    1.  User specifies a collection or query filter.
    2.  Agent queries for matching documents.
    3.  Agent iterates through results and calls `delete_document` for each.

- **Potential Workflow (`/inspect-data`)**:
    1.  User asks complex questions about data state (e.g., "Show me users created yesterday").
    2.  Agent constructs a structured run of `firestore_query_collection`.
    3.  Agent summarizes the results in a readable table.

**L. Firestore Schema Validation**
**Goal**: Ensure data quality against expected types.

- **Tools**: `mcp_firebase-mcp-server_firestore_query_collection`, `mcp_firebase-mcp-server_firebase_validate_security_rules`.
- **Potential Workflow (`/validate-schema`)**:
    1.  Agent samples N documents from a collection.
    2.  Agent checks if fields match the expected TypeScript interfaces.
    3.  Agent reports anomalies (missing fields, wrong types).
    4.  Agent optionally cross-references with `firestore.rules` using `validate_security_rules`.

**M. Data Connect Prototyping**
**Goal**: Rapidly iterate on GraphQL schemas and queries.

- **Tools**: `dataconnect_generate_schema`, `dataconnect_generate_operation`, `dataconnect_build`, `dataconnect_execute`.
- **Potential Workflow (`/proto-fdc`)**:
    1.  User describes a data model (natural language).
    2.  Agent calls `generate_schema`.
    3.  Agent calls `generate_operation` to create queries.
    4.  Agent runs `execute` to verify against the local emulator.

**N. Realtime Database Operations**
**Goal**: Read and write configuration or state data in RTDB.

- **Tools**: `mcp_firebase-mcp-server_realtimedatabase_get_data`, `mcp_firebase-mcp-server_realtimedatabase_set_data`.
- **Potential Workflow (`/rtdb-config`)**:
    1.  User requests to update feature flags stored in RTDB.
    2.  Agent fetches current config at `/config/flags`.
    3.  Agent modifies the JSON structure based on user request.
    4.  Agent writes back the data using `set_data`.

**O. Storage Asset Retrieval**
**Goal**: debug or verify files stored in Cloud Storage buckets.

- **Tools**: `mcp_firebase-mcp-server_storage_get_object_download_url`.
- **Potential Workflow (`/get-file`)**:
    1.  User provides a path to a file in storage (e.g., `users/123/avatar.png`).
    2.  Agent requests a download URL.
    3.  Agent lists the URL for the user to verify.

#### Other Tools

**P. User Management & Support**
**Goal**: Assist support teams and developers with user lookup, roles, and administration.

- **Tools**: `auth_get_users`, `auth_update_user`, `firestore_query_collection`.

- **Potential Workflow (`/find-user`)**:
    1.  Lookup user by email or phone.
    2.  Fetch their recent Firestore activity.
    3.  Optionally disable account.

- **Potential Workflow (`/assign-role`)**:
    1.  User provides target email and role name (e.g., "admin", "beta").
    2.  Agent verifies user existence with `auth_get_users`.
    3.  Agent applies custom claims `{ [role]: true }` using `auth_update_user`.

- **Potential Workflow (`/inspect-claims`)**:
    1.  User provides email.
    2.  Agent retrieves user record.
    3.  Agent dumps the `customClaims` object to verify permissions.

**Q. Crashlytics Triage Workflow**
**Goal**: Automate the investigation of new crashes.

- **Tools**: `crashlytics_get_top_issues`, `crashlytics_get_issue`, `crashlytics_list_events`, `crashlytics_create_note`.
- **Potential Workflow (`/triage-crashes`)**: 1. Fetch top fatal issues from last 24h. 2. For each issue, retrieve the stack trace and device distribution. 3. Agent analyzes the trace against the codebase. 4. Agent posts a note to the issue in the Firebase Console with the analysis.
  **Recommendation**:
  These workflows require dynamic parameters (user emails, crash IDs). They are best implemented as Antigravity workflows that prompt the user for input or use previous context, rather than static scripts.
