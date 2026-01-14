include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../terraform/modules/app-config"
}

dependency "foundation" {
  config_path = "../foundation"
  
  mock_outputs = {
    project_id = "mock-project-id"
  }
}

inputs = {
  project_id           = dependency.foundation.outputs.project_id
  environment          = "prod"
  region               = "us-central1"
  
  public_functions     = ["fbFunction1"]
  app_hosting_backend_name = "fb-app-hosting-backend"
  
  # Update these with your actual values
  github_owner         = "YOUR_GITHUB_OWNER"
  github_repo          = "YOUR_GITHUB_REPO"
  trigger_branch_regex = "^main$"

  # Scheduled Jobs (Cron)
  # scheduled_jobs = [
  #   {
  #     name     = "daily-job"
  #     schedule = "0 0 * * *"
  #     uri      = "https://us-central1-YOUR_PROD_PROJECT_ID.cloudfunctions.net/dailyJob"
  #   }
  # ]
}
