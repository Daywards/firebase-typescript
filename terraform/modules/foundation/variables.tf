variable "project_id" {
  description = "The GCP Project ID to create"
  type        = string
}

variable "project_name" {
  description = "The human-readable name of the project"
  type        = string
}

variable "billing_account" {
  description = "The Billing Account ID to attach to the project"
  type        = string
}

variable "environment" {
  description = "The environment name (e.g. dev, stage, prod)"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain for Firebase Hosting (e.g. app.example.com). Set to null to disable."
  type        = string
  default     = null
}

variable "dns_zone_name" {
  description = "Cloud DNS Managed Zone name. Required if custom_domain is set."
  type        = string
  default     = null
}

variable "dns_project_id" {
  description = "The GCP Project ID where the Cloud DNS Managed Zone resides. Defaults to the environment project if not set."
  type        = string
  default     = null
}

variable "billing_budget_amount" {
  description = "The amount (in USD) for the project's billing budget alert."
  type        = number
  default     = 100
}
