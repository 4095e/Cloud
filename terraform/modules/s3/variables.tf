variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "bucket_suffix" {
  description = "Unique suffix for bucket names"
  type        = string
}

variable "force_destroy" {
  description = "Force destroy S3 buckets (use with caution)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}