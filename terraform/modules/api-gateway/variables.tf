variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "stage_name" {
  description = "API Gateway deployment stage name"
  type        = string
  default     = "v1"
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool for authorization"
  type        = string
}

variable "auth_lambda_arn" {
  description = "ARN of the auth Lambda function"
  type        = string
}

variable "files_lambda_arn" {
  description = "ARN of the files Lambda function"
  type        = string
}

variable "users_lambda_arn" {
  description = "ARN of the users Lambda function"
  type        = string
}

variable "auth_lambda_function_name" {
  description = "Name of the auth Lambda function"
  type        = string
}

variable "files_lambda_function_name" {
  description = "Name of the files Lambda function"
  type        = string
}

variable "users_lambda_function_name" {
  description = "Name of the users Lambda function"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}