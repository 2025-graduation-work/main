variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "asia-northeast1"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "front-app"
}

variable "repository_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "app-repo"
}
