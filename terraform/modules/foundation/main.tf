terraform {
  required_version = ">= 1.8.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0"
    }
  }
}

# 0. Create Project & Enable Firebase
resource "google_project" "main" {
  project_id      = var.project_id
  name            = var.project_name
  billing_account = var.billing_account
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = google_project.main.project_id

  depends_on = [
    google_project_service.custom_apis
  ]
}

# 1. Enable Required APIs
resource "google_project_service" "custom_apis" {
  for_each = toset([
    "firebase.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com"
  ])

  project = google_project.main.project_id
  service = each.key

  disable_on_destroy = false
}

# 2. Firebase Hosting Custom Domain (Beta)
resource "google_firebase_hosting_custom_domain" "default" {
  provider = google-beta
  count    = var.custom_domain != null ? 1 : 0

  project       = google_project.main.project_id
  site_id       = google_firebase_project.default.project # Default site ID is project ID
  custom_domain = var.custom_domain

  wait_dns_verification = false
}

# 3. Cloud DNS Records (Automated)
resource "google_dns_record_set" "hosting_verification" {
  count = var.custom_domain != null && var.dns_zone_name != null ? length(google_firebase_hosting_custom_domain.default[0].required_dns_updates) : 0

  project      = var.dns_project_id != null ? var.dns_project_id : google_project.main.project_id
  managed_zone = var.dns_zone_name

  name = google_firebase_hosting_custom_domain.default[0].required_dns_updates[count.index].domain_name
  type = google_firebase_hosting_custom_domain.default[0].required_dns_updates[count.index].type
  ttl  = 300

  rrdatas = [google_firebase_hosting_custom_domain.default[0].required_dns_updates[count.index].rdata]
}

# 4. Cloud Billing Budget
resource "google_billing_budget" "budget" {
  provider        = google-beta
  billing_account = var.billing_account
  display_name    = "Budget for ${var.project_name} (${var.environment})"

  budget_filter {
    projects = ["projects/${google_project.main.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = var.billing_budget_amount
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
}
