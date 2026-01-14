include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../terraform/modules/foundation"
}

inputs = {
  project_id           = "YOUR_PROD_PROJECT_ID" # Will be created
  project_name         = "My App Prod"
  billing_account      = "YOUR_BILLING_ACCOUNT_ID"
  environment          = "prod"
  
  # Custom Domain (Optional)
  # custom_domain        = "myapp.com"
  # dns_zone_name        = "myapp-zone"
  # dns_project_id       = "your-dns-project-id"

  # Billing
  billing_budget_amount = 100
}
