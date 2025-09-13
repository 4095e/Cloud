variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cloud-storage"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "cloud-storage"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# S3 Configuration
variable "s3_force_destroy" {
  description = "Force destroy S3 buckets (use with caution)"
  type        = bool
  default     = true
}

# Cognito Configuration
variable "cognito_user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
  default     = "cloud-storage-users"
}

# DynamoDB Configuration
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

# API Gateway Configuration
variable "api_gateway_stage" {
  description = "API Gateway deployment stage"
  type        = string
  default     = "v1"
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_memory_size" {
  description = "Lambda memory size"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}