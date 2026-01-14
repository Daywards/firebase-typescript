include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../terraform/modules/foundation"
}

inputs = {
  project_id           = "YOUR_STAGE_PROJECT_ID" # Will be created
  project_name         = "My App Stage"
  billing_account      = "YOUR_BILLING_ACCOUNT_ID"
  environment          = "stage"
  
  # Custom Domain (Optional)
  # custom_domain        = "stage.myapp.com"
  # dns_zone_name        = "myapp-zone"
  # dns_project_id       = "your-dns-project-id"

  # Billing
  billing_budget_amount = 50
}
