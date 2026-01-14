terraform {
  required_version = ">= 1.8.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

# 0. Artifact Registry Repository
resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "app-hosting-repo"
  description   = "Docker repository for App Hosting images"
  format        = "DOCKER"
  project       = var.project_id
}

# 1. Cloud Run Service (The "App Hosting" Backend)
resource "google_cloud_run_service" "default" {
  name     = var.app_hosting_backend_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder, managed by CI/CD

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  # Ignore image changes so Terraform doesn't revert CI/CD deployments
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
      traffic # Allow Cloud Run to manage traffic split if needed
    ]
  }
}

# 2. IAM Bindings

# Cloud Functions Public Access
resource "google_cloudfunctions2_function_iam_member" "public_functions" {
  for_each = toset(var.public_functions)

  project        = var.project_id
  location       = var.region
  cloud_function = each.key
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

# App Hosting Backend Public Access (Cloud Run)
resource "google_cloud_run_service_iam_member" "public_app_hosting" {
  project  = var.project_id
  location = var.region
  service  = google_cloud_run_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Default Compute Service Account Roles
# Needed for Cloud Build to deploy functions permissions
resource "google_project_iam_member" "compute_sa_roles" {
  for_each = toset([
    "roles/cloudfunctions.admin",
    "roles/iam.serviceAccountUser"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${var.project_id}-compute@developer.gserviceaccount.com"
}

# 2. Cloud Build Repository Connection (GitHub)
resource "google_cloudbuildv2_connection" "github" {
  project  = var.project_id
  location = var.region
  name     = "${var.environment}-github-conn"

  github_config {
    # This creates the connection resource. 
    # You will need to click "Link" in the Cloud Console to authorize it with the GitHub App.
  }
}

resource "google_cloudbuildv2_repository" "repo" {
  project           = var.project_id
  location          = var.region
  name              = var.github_repo
  parent_connection = google_cloudbuildv2_connection.github.name
  remote_uri        = "https://github.com/${var.github_owner}/${var.github_repo}.git"
}

# 3. Cloud Build Triggers
resource "google_cloudbuild_trigger" "environment_trigger" {
  project     = var.project_id
  location    = var.region
  name        = "deploy-${var.environment}"
  description = "Trigger for ${var.environment} environment"

  repository_event_config {
    repository = google_cloudbuildv2_repository.repo.id
    push {
      branch = var.trigger_branch_regex
    }
  }

  filename = "cloudbuild.yaml"

  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"

  substitutions = {
    "_APP_HOSTING_REGION"  = var.region
    "_APP_HOSTING_BACKEND" = var.app_hosting_backend_name
  }

  service_account = google_service_account.cloudbuild_runner.id
}

# 4. Cloud Build Service Account & IAM
resource "google_service_account" "cloudbuild_runner" {
  project      = var.project_id
  account_id   = "cloudbuild-runner"
  display_name = "Cloud Build Runner Service Account"
}

locals {
  cloudbuild_roles = [
    "roles/cloudbuild.builds.builder", # Required to run builds
    "roles/firebase.admin",            # Full Firebase access
    "roles/serviceusage.serviceUsageAdmin",
    "roles/cloudbuild.builds.editor",
    "roles/iam.serviceAccountUser", # Required to act as other SAs (e.g. for Functions)
    "roles/run.admin",              # Cloud Run / App Hosting
    "roles/artifactregistry.admin", # Push to Artifact Registry
    "roles/storage.admin",          # Storage access
    "roles/logging.logWriter",      # Logging
    "roles/secretmanager.secretAccessor",
    "roles/developerconnect.readTokenAccessor",
    "roles/cloudfunctions.admin",
    "roles/serviceusage.apiKeysViewer"
  ]
}

resource "google_project_iam_member" "cloudbuild_roles" {
  for_each = toset(local.cloudbuild_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloudbuild_runner.email}"
}

# 5. Cloud Scheduler (Cron Jobs)
# Service Account for Cloud Scheduler
resource "google_service_account" "scheduler_sa" {
  project      = var.project_id
  account_id   = "cloud-scheduler-sa"
  display_name = "Cloud Scheduler Service Account"
}

# Grant Scheduler SA permission to invoke Cloud Run and Cloud Functions (Gen 1 & 2)
# We grant this at the project level to allow scheduling any service/function.
resource "google_project_iam_member" "scheduler_invoker" {
  for_each = toset([
    "roles/run.invoker",
    "roles/cloudfunctions.invoker"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each = { for job in var.scheduled_jobs : job.name => job }

  project     = var.project_id
  region      = var.region
  name        = each.value.name
  description = each.value.description
  schedule    = each.value.schedule
  time_zone   = each.value.time_zone

  http_target {
    http_method = "POST"
    uri         = each.value.uri

    oidc_token {
      service_account_email = each.value.service_account_email != null ? each.value.service_account_email : google_service_account.scheduler_sa.email
    }
  }
}
