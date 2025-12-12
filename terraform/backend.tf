terraform {
  backend "gcs" {
    bucket  = "2025-graduation-work"
    prefix  = "terraform/state"
  }
}
