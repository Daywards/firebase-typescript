remote_state {
  backend = "gcs"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    project                  = get_env("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")
    location                 = "us"
    bucket                   = "${get_env("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")}-terraform-state"
    prefix                   = "${path_relative_to_include()}/terraform.tfstate"
    disable_bucket_versioning = false
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "google" {
  project = "${get_env("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")}"
  region  = "us-central1"
}

provider "google-beta" {
  project = "${get_env("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID")}"
  region  = "us-central1"
}
EOF
}
