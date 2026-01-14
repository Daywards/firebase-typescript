# Walkthrough - Terragrunt/Terraform Migration

I have successfully scaffolded the Terragrunt and Terraform setup for your Firebase project.

## 1. Directory Structure

**Manual Action Required**:
The module now **creates** the GCP project. You must provide a valid `billing_account` ID in the `terragrunt.hcl` files.

```text
terraform/
├── modules/
│   └── firebase-environment/    # Core Terraform module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── live/
    ├── terragrunt.hcl           # Root config (GCS backend, Providers)
    ├── dev/
    │   └── terragrunt.hcl       # Dev environment config
    ├── stage/
    │   └── terragrunt.hcl       # Stage environment config
    └── prod/
        └── terragrunt.hcl       # Prod environment config
```

## 2. Manual Action Items

> [!IMPORTANT]
> You must fill in the placeholders for the following environments:

- `terraform/live/stage`: Staging environment.
- `terraform/live/prod`: Production environment.
  And also `terraform/live/terragrunt.hcl` before running the scripts.

1.  **Open `terraform/live/{stage,prod}/terragrunt.hcl`** and update:
    - `project_id`: The ID you want for the **new** GCP Project.
    - `project_name`: The display name for the new project.
    - `billing_account`: Your Google Cloud Billing Account ID.
    - `github_owner`: Your GitHub User or Organization name.
    - `github_repo`: Your GitHub Repository name.
    - `trigger_branch_regex`: Confirm or update branch patterns (e.g. `^main$` for prod).
    - **(Optional) Custom Domain**: Uncomment and set `custom_domain`,`dns_zone_name` and `dns_project_id` to enable automated domain mapping. Note that this may require running `apply` twice.
    - **Billing Budget**: Set `billing_budget_amount` (defaults to 100 USD).
    - **Scheduled Jobs**: Define `scheduled_jobs` list to create Cloud Scheduler jobs.

2.  **Authorize GitHub Connection**:
    After running `pnpm infra:apply:[env]`, the Cloud Build Connection will be created in a **PENDING** state.
    - Go to the [Google Cloud Console > Cloud Build > Repositories](https://console.cloud.google.com/cloud-build/repositories).
    - Switch to your new project.
    - Click on the "Manage" or "Finish Setup" button for the pending GitHub connection to authorize it with your GitHub account.

3.  **Open `terraform/live/terragrunt.hcl`** and update:
    - `project`: Your GCP Project ID (for the state bucket).

4.  **Install Tools**:

    The recommended way to install `mise` on macOS is via Homebrew:

    ```bash
    brew install mise
    echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
    source ~/.zshrc
    ```

    Then run:

    ```bash
    mise trust
    mise install
    ```

    _Note: `mise trust` is required to allow the local config to be loaded._
    This will install the pinned versions of `terraform` and `terragrunt` specified in `mise.toml`.

## 3. Usage

After configuration, you can use the new npm scripts:

- `pnpm infra:plan:[env]`: Preview changes (env: dev, stage, prod).
- `pnpm infra:apply:[env]`: Apply changes.
- `pnpm infra:validate:[env]`: Validate the configuration.

## 4. Verification

Run the plan command to ensure everything is correct:

```bash
pnpm infra:plan:dev
```
