output "trigger_id" {
  value = google_cloudbuild_trigger.environment_trigger.id
}

output "scheduler_sa_email" {
  value = google_service_account.scheduler_sa.email
}
