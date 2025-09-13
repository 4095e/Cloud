terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}

# Random ID for unique naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  
  # Unique naming
  bucket_suffix = random_id.bucket_suffix.hex
  
  # Resource names
  s3_files_bucket     = "${var.project_name}-files-${var.environment}-${local.bucket_suffix}"
  s3_frontend_bucket  = "${var.project_name}-frontend-${var.environment}-${local.bucket_suffix}"
  
  # Common tags
  common_tags = merge(var.tags, {
    Region    = local.region
    AccountId = local.account_id
  })
}

# S3 Module - File Storage
module "s3" {
  source = "./modules/s3"
  
  project_name    = var.project_name
  environment     = var.environment
  bucket_suffix   = local.bucket_suffix
  force_destroy   = var.s3_force_destroy
  tags           = local.common_tags
}

# DynamoDB Module - Metadata Storage
module "dynamodb" {
  source = "./modules/dynamodb"
  
  project_name   = var.project_name
  environment    = var.environment
  billing_mode   = var.dynamodb_billing_mode
  tags          = local.common_tags
}

# Cognito Module - Authentication
module "cognito" {
  source = "./modules/cognito"
  
  project_name          = var.project_name
  environment           = var.environment
  user_pool_name        = var.cognito_user_pool_name
  frontend_domain       = module.cloudfront.domain_name
  tags                 = local.common_tags
}

# IAM Module - Roles and Policies
module "iam" {
  source = "./modules/iam"
  
  project_name     = var.project_name
  environment      = var.environment
  s3_files_bucket  = module.s3.files_bucket_name
  dynamodb_table   = module.dynamodb.table_name
  tags            = local.common_tags
}

# Lambda Module - Backend Functions
module "lambda" {
  source = "./modules/lambda"
  
  project_name         = var.project_name
  environment          = var.environment
  runtime             = var.lambda_runtime
  memory_size         = var.lambda_memory_size
  timeout             = var.lambda_timeout
  
  # Dependencies
  lambda_role_arn      = module.iam.lambda_execution_role_arn
  s3_files_bucket      = module.s3.files_bucket_name
  dynamodb_table       = module.dynamodb.table_name
  cognito_user_pool_id = module.cognito.user_pool_id
  
  tags = local.common_tags
}

# API Gateway Module - REST API
module "api_gateway" {
  source = "./modules/api-gateway"
  
  project_name                = var.project_name
  environment                 = var.environment
  stage_name                 = var.api_gateway_stage
  
  # Lambda functions
  auth_lambda_arn            = module.lambda.auth_function_arn
  files_lambda_arn           = module.lambda.files_function_arn
  users_lambda_arn           = module.lambda.users_function_arn
  
  # Lambda invoke permissions
  auth_lambda_function_name  = module.lambda.auth_function_name
  files_lambda_function_name = module.lambda.files_function_name
  users_lambda_function_name = module.lambda.users_function_name
  
  # Cognito
  cognito_user_pool_id       = module.cognito.user_pool_id
  
  tags = local.common_tags
}

# CloudFront Module - CDN
module "cloudfront" {
  source = "./modules/cloudfront"
  
  project_name         = var.project_name
  environment          = var.environment
  domain_name          = var.domain_name
  
  # S3 origins
  frontend_bucket_name = module.s3.frontend_bucket_name
  files_bucket_name    = module.s3.files_bucket_name
  
  # API Gateway
  api_gateway_domain   = module.api_gateway.api_gateway_domain
  
  tags = local.common_tags
}