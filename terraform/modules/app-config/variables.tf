variable "project_id" {
  description = "The GCP Project ID (dependency from foundation)"
  type        = string
}

variable "environment" {
  description = "The environment name (e.g. dev, stage, prod)"
  type        = string
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "public_functions" {
  description = "List of Cloud Functions to make public"
  type        = list(string)
  default     = []
}

variable "app_hosting_backend_name" {
  description = "Name of the Cloud Run service for App Hosting"
  type        = string
  default     = "fb-app-hosting-backend"
}

variable "github_owner" {
  description = "The GitHub owner (user or organization)"
  type        = string
}

variable "github_repo" {
  description = "The GitHub repository name"
  type        = string
}

variable "trigger_branch_regex" {
  description = "Regex for the branch to trigger Cloud Build"
  type        = string
}

variable "scheduled_jobs" {
  description = "List of scheduled jobs (cron) to trigger Cloud Run services or Cloud Functions."
  type = list(object({
    name        = string
    description = optional(string)
    schedule    = string
    time_zone   = optional(string, "Etc/UTC")
    uri         = string
    # Optional: overrides the default scheduler SA if provided
    service_account_email = optional(string)
  }))
  default = []
}
