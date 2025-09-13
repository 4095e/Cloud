variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
}

variable "frontend_domain" {
  description = "Frontend domain for OAuth callbacks"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}