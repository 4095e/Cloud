# Data source to create Lambda deployment packages
data "archive_file" "auth_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/src/auth"
  output_path = "${path.module}/auth-lambda.zip"
}

data "archive_file" "files_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/src/files"
  output_path = "${path.module}/files-lambda.zip"
}

data "archive_file" "users_lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../backend/src/users"
  output_path = "${path.module}/users-lambda.zip"
}

# Auth Lambda function
resource "aws_lambda_function" "auth" {
  filename         = data.archive_file.auth_lambda.output_path
  function_name    = "${var.project_name}-auth-${var.environment}"
  role            = var.lambda_role_arn
  handler         = "index.handler"
  runtime         = var.runtime
  memory_size     = var.memory_size
  timeout         = var.timeout
  
  source_code_hash = data.archive_file.auth_lambda.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE         = var.dynamodb_table
      S3_FILES_BUCKET        = var.s3_files_bucket
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      ENVIRONMENT            = var.environment
      NODE_ENV               = var.environment == "prod" ? "production" : "development"
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-auth-${var.environment}"
    Description = "Authentication and authorization functions"
  })
}

# Files Lambda function
resource "aws_lambda_function" "files" {
  filename         = data.archive_file.files_lambda.output_path
  function_name    = "${var.project_name}-files-${var.environment}"
  role            = var.lambda_role_arn
  handler         = "index.handler"
  runtime         = var.runtime
  memory_size     = var.memory_size
  timeout         = var.timeout
  
  source_code_hash = data.archive_file.files_lambda.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE         = var.dynamodb_table
      S3_FILES_BUCKET        = var.s3_files_bucket
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      ENVIRONMENT            = var.environment
      NODE_ENV               = var.environment == "prod" ? "production" : "development"
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-files-${var.environment}"
    Description = "File operations and management"
  })
}

# Users Lambda function
resource "aws_lambda_function" "users" {
  filename         = data.archive_file.users_lambda.output_path
  function_name    = "${var.project_name}-users-${var.environment}"
  role            = var.lambda_role_arn
  handler         = "index.handler"
  runtime         = var.runtime
  memory_size     = var.memory_size
  timeout         = var.timeout
  
  source_code_hash = data.archive_file.users_lambda.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE         = var.dynamodb_table
      S3_FILES_BUCKET        = var.s3_files_bucket
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      ENVIRONMENT            = var.environment
      NODE_ENV               = var.environment == "prod" ? "production" : "development"
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-users-${var.environment}"
    Description = "User management and profiles"
  })
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "auth_logs" {
  name              = "/aws/lambda/${aws_lambda_function.auth.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "files_logs" {
  name              = "/aws/lambda/${aws_lambda_function.files.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "users_logs" {
  name              = "/aws/lambda/${aws_lambda_function.users.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = var.tags
}