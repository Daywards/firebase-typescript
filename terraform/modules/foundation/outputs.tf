output "project_id" {
  description = "The ID of the created GCP project"
  value       = google_project.main.project_id
}

output "project_number" {
  description = "The number of the created GCP project"
  value       = google_project.main.number
}

output "enabled_apis" {
  description = "List of enabled APIs"
  value       = [for api in google_project_service.custom_apis : api.service]
}
