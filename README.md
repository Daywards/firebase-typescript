# Firebase Typescript Monorepo

This is a **typescript monorepo** managed with [PNPM](https://pnpm.io/), designed to jumpstart the development of modern Firebase web applications with a shared codebase.

It provides a production-ready foundation including:

- **Next.js** application configured for **Firebase App Hosting**.
- **Vite + React** application configured for **Firebase Hosting**.
- **Shared packages** for UI components and ESLint configuration.
- **CI/CD** pipelines ready for Google Cloud Build.

## 🛠 Features (Batteries Included)

- **Package Manager**: [pnpm](https://pnpm.io/) (v10) with workspace support.
- **Runtime**: Node.js (v22).
- **Frameworks**:
    - [Next.js](https://nextjs.org/) (App Router).
    - [Vite](https://vitejs.dev/) + [React](https://react.dev/).
- **Styles**: [Tailwind CSS](https://tailwindcss.com/) (v4 optimized).
- **Cloud Platform**: [Firebase](https://firebase.google.com/) (Hosting, App Hosting, Emulators).
- **Quality Control**:
    - **Linting**: ESLint (Shared config), Commitlint (Conventional Commits).
    - **Formatting**: Prettier + EditorConfig.
    - **Testing**: Vitest.
    - **Hooks**: Husky (pre-commit).
- **Version Control**: [fnm](https://github.com/fnm-rs/fnm) (Node Version Manager).

## Antigravity Workflow & Cloud Console Setup

> To get a good overview of the [Antigravity](https://antigravity.google/) coding workflow supported by this template, and the Firebase and GCP Cloud Console workflows needed to deploy and monitor, **watch the detailed walkthrough**: [Firebase, Antigravity & Typescript FTW](https://daywards.com/media/the-case-for-firebase/firebase-antigravity-and-typescript-ftw)

---

## 🚀 Using this Template

### 1. Create your repository

Click the **"Use this template"** button on GitHub to create a new repository from this starter.

### 2. Install Dependencies

Ensure you have `Node.js v22` and `pnpm v10`.

```bash
# Enable pnpm via corepack (recommended)
corepack enable

# Install project dependencies
pnpm install
```

### 3. Rename Project

1.  **Package Names**: Update the `name` fields in `package.json` files to match your project:
    - Root `package.json`
    - `apps/fb-app-hosting/package.json`
    - `apps/fb-hosting/package.json`
    - `packages/ui/package.json`
2.  **Directories**: (Optional) Rename folders in `apps/` to match your new project names (e.g., `apps/my-client`, `apps/my-admin`).
3.  **References**: If you rename directories, you **MUST** update path references in:
    - `pnpm-workspace.yaml`
    - `firebase.json`
    - `cloudbuild.yaml`
    - Package scripts and imports

### 4. Configure Firebase

1.  **Select Projects**: Update `.firebaserc` with your Firebase project IDs. usage recommendation: Set `default` to your staging project.
    ```json
    {
        "projects": {
            "default": "your-staging-project-id",
            "staging": "your-staging-project-id",
            "production": "your-production-project-id"
        }
    }
    ```
2.  **App Hosting**: Ensure you have a Firebase App Hosting backend set up and linked to your repository.
    - Use `pnpm list-projects` to see all projects available to your Firebase account.
    - Use `pnpm switch-project` to select the active project to initialize App Hosting for.
    - Run `npx firebase init apphosting` to initialize App Hosting for that project.
    - Update `apps/fb-app-hosting/apphosting.yaml` if necessary.

---

## 🧑‍💻 Development Workflow

### Start Development Server

Runs the Firebase Emulators, Frontend apps, and Storybook concurrently.

```bash
pnpm dev
```

### Available Scripts

| Script                     | Description                                                       |
| :------------------------- | :---------------------------------------------------------------- |
| `pnpm build`               | Builds all apps and packages in the workspace.                    |
| `pnpm create-sa`           | Creates a service account for Cloud Build.                        |
| `pnpm dev`                 | Starts dev servers, emulators, and Storybook concurrently.        |
| `pnpm format`              | Formats code using Prettier.                                      |
| `pnpm kill-emulator-ports` | Kills processes occupying Firebase emulator ports.                |
| `pnpm lint`                | Runs linting across all workspaces.                               |
| `pnpm list-projects`       | Lists available Firebase projects (`npx firebase projects:list`). |
| `pnpm prepare`             | Sets up Husky git hooks.                                          |
| `pnpm reinstall`           | Clean re-install: removes lockfile, node_modules, and reinstalls. |
| `pnpm setup-builder-iam`   | Grants IAM roles to the builder service account.                  |
| `pnpm switch-project`      | Switches the active Firebase project (`npx firebase use`).        |
| `pnpm test`                | Runs tests across all workspaces.                                 |
| `pnpm typecheck`           | Runs TypeScript type checking across all workspaces.              |
| `pnpm validate`            | Runs linting and type checking concurrently.                      |

### Available Agent Workflows

Use these slash commands to trigger predefined AI agent workflows:

| Workflow          | Description                                        |
| :---------------- | :------------------------------------------------- |
| `/commit`         | Formulate a full commit given uncommitted changes. |
| `/format`         | Format the codebase using Prettier.                |
| `/lint`           | Run linting across the entire monorepo.            |
| `/list-projects`  | List all available Firebase projects.              |
| `/push`           | Push local commits to remote.                      |
| `/switch-project` | Switch the active Firebase project.                |
| `/test`           | Run tests across the workspace.                    |
| `/typecheck`      | Run typechecking across the workspace.             |
| `/validate`       | Run linting and typechecking concurrently.         |

---

## 📂 Project Structure

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

---

## 🚢 CI/CD Setup (Cloud Build)

This project includes a `cloudbuild.yaml` file configured for:

1.  **Testing**: Runs unit tests and linting.
2.  **Building**: Builds all workspace packages.
3.  **Deploying**: Deploys to Firebase Hosting and triggers App Hosting rollouts.

### GCP IAM for Cloud Build

You can use the included scripts to automatically create the service account and assign the necessary roles.

1.  **Create Service Account**:
    ```bash
    pnpm create-sa --sa builder
    ```
2.  **Assign Roles**:
    ```bash
    pnpm setup-builder-iam --sa builder
    ```

---

## 🤝 Contributing

1.  **Commit Messages**: We use **Conventional Commits**.
    - Format: `type(scope): subject`
    - Example: `feat(ui): add button component`
2.  **Pre-commit Hooks**: `husky` will automatically run the `validate` script (linting + type checking) and commit message validation.

---

## 📄 License

This project is licensed under the terms found in the [LICENSE](LICENSE) file.
