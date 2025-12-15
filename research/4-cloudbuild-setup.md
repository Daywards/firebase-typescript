# Cloud Build Best Practices for Monorepo Environments

This document outlines the best practices for setting up `cloudbuild.yaml` configurations to deploy a monorepo to multiple environments (e.g., development, staging, production).

## Core Strategy: Modular Configs & Environment-Specific Triggers

The most robust approach for monorepos is to combine **service-specific build files** with **environment-specific triggers**.

### 1. Monorepo Structure: Dedicated `cloudbuild.yaml` per Service

Avoid a massive, single root `cloudbuild.yaml`. Instead, place a build configuration file within each service's directory.

```
/
├── apps/
│   ├── web-app/
│   │   ├── cloudbuild.yaml  <-- Build steps for this specific app
│   │   └── src/
│   └── api-server/
│       ├── cloudbuild.yaml  <-- Build steps for this specific api
│       └── src/
├── packages/
│   └── ui/
└── cloudbuild.yaml          <-- (Optional) Orchestrator for root-level tasks
```

This keeps configurations modular, readable, and prevents changes in one service from breaking builds in another.

### 2. Triggers with Included/Ignored Files

Configure Cloud Build **triggers** to watch only the relevant paths. This ensures a build for `web-app` only runs when files in `apps/web-app/` (or its shared dependencies) change.

- **Trigger Name**: `web-app-deploy`
- **Included files filter**: `apps/web-app/**`, `packages/ui/**` (if it depends on UI)
- **Ignored files filter**: `apps/api-server/**`

### 3. Environment Management

Do **not** create separate files like `cloudbuild.dev.yaml` and `cloudbuild.prod.yaml` unless the build steps are fundamentally different. Instead, use a **single `cloudbuild.yaml`** and inject environment differences via **Substitution Variables**.

#### Using Substitution Variables

Define the build steps using variables for environment-dependent values.

**apps/web-app/cloudbuild.yaml**:

```yaml
steps:
    # Build
    - name: 'gcr.io/cloud-builders/docker'
      args: ['build', '-t', 'gcr.io/$PROJECT_ID/web-app:$_ENV-$COMMIT_SHA', '.']
    # Deploy
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      entrypoint: gcloud
      args:
          - 'run'
          - 'deploy'
          - 'web-app-$_ENV'
          - '--image'
          - 'gcr.io/$PROJECT_ID/web-app:$_ENV-$COMMIT_SHA'
          - '--region'
          - 'us-central1'
          - '--set-env-vars'
          - 'NEXT_PUBLIC_API_URL=$_API_URL'
substitutions:
    _ENV: 'dev' # Default value
    _API_URL: 'https://dev-api.example.com'
```

#### Configuring Triggers per Environment

Create separate triggers in the Cloud Build Console for each environment, linked to specific branches.

| Trigger Name   | Branch Regex | Substitutions (Overridden in Trigger UI)             |
| :------------- | :----------- | :--------------------------------------------------- |
| `web-app-dev`  | `^dev$`      | `_ENV=dev`<br>`_API_URL=https://dev-api.example.com` |
| `web-app-prod` | `^main$`     | `_ENV=prod`<br>`_API_URL=https://api.example.com`    |

### 4. Dynamic Substitutions

If you need even more flexibility (e.g., dynamic bash logic), enable `dynamicSubstitutions`.

```yaml
options:
    dynamicSubstitutions: true
```

This allows you to reference other variables within your substitutions or use bash string manipulation.

### Summary Checklist

1.  [ ] **Split configs**: One `cloudbuild.yaml` per app/service.
2.  [ ] **Filter paths**: Use "Included files" in trigger settings to limit scope.
3.  [ ] **Single Config, Variable Inputs**: Use `$_VARS` for environment differences (URLs, database names, instance sizes).
4.  [ ] **Branch-based Triggers**: Map `main` branch -> Production env, `dev` branch -> Development env.

## Multi-Region Deployment Strategies

When a `prod` branch is triggered, you often want to deploy to multiple regions (e.g., `us-central1` and `europe-west1`) to ensure high availability. There are two primary ways to achieve this:

### Option A: Parallel Cloud Build Steps (Simpler)

Cloud Build allows steps to run concurrently using the `waitFor: ['-']` configuration. You can trigger deployments to multiple regions simultaneously within a single `cloudbuild.yaml`.

```yaml
steps:
    # ... build step ...

    # Deploy to US Central (Parallel)
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      id: 'deploy-us-central1'
      entrypoint: gcloud
      args:
          - 'run'
          - 'deploy'
          - 'web-app-prod-us'
          - '--image'
          - 'gcr.io/$PROJECT_ID/web-app:$_ENV-$COMMIT_SHA'
          - '--region'
          - 'us-central1'
      waitFor: ['build-step-id'] # Wait for build to finish

    # Deploy to Europe West (Parallel)
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      id: 'deploy-europe-west1'
      entrypoint: gcloud
      args:
          - 'run'
          - 'deploy'
          - 'web-app-prod-eu'
          - '--image'
          - 'gcr.io/$PROJECT_ID/web-app:$_ENV-$COMMIT_SHA'
          - '--region'
          - 'europe-west1'
      waitFor: ['build-step-id'] # Start immediately after build, run parallel to US deploy
```

**Pros:**

- Simple configuration in one file.
- No extra services like Cloud Deploy needed.

**Cons:**

- harder to manage rollbacks or staggered rollouts (canary).

### Option B: Google Cloud Deploy (Robust)

For a more enterprise-grade solution, use **Google Cloud Deploy**.

1.  **Define a Multi-Target**: Create a target in Cloud Deploy that groups multiple child targets (e.g. `prod-multi-region` -> [`prod-us`, `prod-eu`]).
2.  **Pipeline**: Your `cloudbuild.yaml` simply creates a "release" in Cloud Deploy.
3.  **Rollout**: Cloud Deploy handles the orchestration, deploying to all child targets in parallel or confirming successful deployment in one before moving to the next.

**cloudbuild.yaml**:

```yaml
steps:
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      entrypoint: gcloud
      args:
          - 'deploy'
          - 'releases'
          - 'create'
          - 'rel-$COMMIT_SHA'
          - '--delivery-pipeline=web-app-pipeline'
          - '--region=us-central1'
```

**Pros:**

- Built-in rollback, promotion, and approval capabilities.
- Visual dashboard of deployment state per region.

**Cons:**

- Requires setting up Cloud Deploy resources (Pipeline, Targets) separately.

## Firebase-Specific Adjustments

For this monorepo, which contains both **Firebase App Hosting** (`apps/fb-app-hosting`) and **Firebase Hosting** (`apps/fb-hosting`), use the following specialized strategies.

### 1. Firebase App Hosting (For Next.js App)

Since you require a **unified build log** (to see one dashboard for all apps), avoid the native GitHub integration. Instead, trigger the App Hosting rollout explicitly from your Cloud Build pipeline.

**Strategy: "The Caller" with Log Streaming**
Use `cloudbuild.yaml` to trigger the rollout and then **stream the logs** of the child build back to the parent. This creates a unified log experience.

```yaml
steps:
    # ... other build steps ...

    # Trigger App Hosting Rollout & Stream Logs
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      entrypoint: 'bash'
      args:
          - '-c'
          - |
              npm install -g firebase-tools jq

              echo "Triggering App Hosting Rollout..."

              # Create rollout and capture JSON output
              ROLLOUT_JSON=$(npx firebase apphosting:rollouts:create \
                projects/$PROJECT_ID/locations/us-central1/backends/my-app-backend \
                --git-branch=$BRANCH_NAME \
                --token=$FIREBASE_TOKEN \
                --force \
                --json)

              # Extract Build ID (assuming typical JSON structure, adjust based on actual output)
              BUILD_ID=$(echo $ROLLOUT_JSON | jq -r '.buildName' | awk -F/ '{print $NF}')

              if [ -n "$BUILD_ID" ]; then
                echo "Rollout triggered. Streaming logs for Build ID: $BUILD_ID"
                gcloud builds log --stream $BUILD_ID
              else
                echo "Failed to extract Build ID. Rollout creation might have failed."
                echo $ROLLOUT_JSON
                exit 1
              fi
```

**Pros:**

- **Unified Logs**: You see the "real" build progress in your main Cloud Build dashboard.
- **Synchronous**: The step waits for the App Hosting build to finish (because `gcloud builds log --stream` exits when the build completes).
- **Failure Propagation**: If the child build fails, `gcloud builds log` will exit, allowing you to capture that and fail the parent build.

**Cons:**

- **Complexity**: Requires a customized shell script step with `jq`.
- **Latency**: Slight delay in log streaming.

### 2. Firebase Hosting (For Static Sites / SPAs)

**Recommendation:** Use `cloudbuild.yaml` with `firebase-tools`.

- **Docker Image**: Use `gcr.io/google.com/cloudsdktool/cloud-sdk` (includes `gcloud`) or a custom node image with `firebase-tools` installed.
- **Identity**: Use the Cloud Build Service Account. Grant it `Firebase Admin` and `Service Account User` roles.
- **Command**: `npx firebase deploy --only hosting:target-site-name --token $FIREBASE_TOKEN` (or better, use Google Cloud Identity federation so no token is needed).

**Example `apps/fb-hosting/cloudbuild.yaml`**:

```yaml
steps:
    # Install Dependencies (with caching for speed - optional but recommended)
    - name: 'node:20'
      entrypoint: 'npm'
      args: ['ci']

    # Build Static Site
    - name: 'node:20'
      entrypoint: 'npm'
      args:
          - 'run'
          - 'build'

    # Deploy to Firebase Hosting
    - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
      entrypoint: 'bash'
      args:
          - '-c'
          - |
              npm install -g firebase-tools
              npx firebase deploy --only hosting:firebase-typescript-hosting --project $PROJECT_ID
```

### 3. Handling Shared Dependencies in Monorepo

- **Issue**: Cloud Functions or App Hosting builds might fail if they can't access local packages (`packages/ui`).
- **Solution**:
    - **App Hosting**: Handles this natively if using a supported package manager (npm/yarn/pnpm workspaces).
    - **Cloud Functions**: Use `npm pack` in your build step to create a `.tgz` of the shared library and refer to it in `package.json`, OR use the `codebase` configuration in `firebase.json` (supported in newer Firebase CLI versions).
