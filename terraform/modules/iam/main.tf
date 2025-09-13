# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-lambda-execution-${var.environment}"
    Description = "Execution role for Lambda functions"
  })
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# S3 access policy for Lambda
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "${var.project_name}-lambda-s3-${var.environment}"
  description = "IAM policy for S3 access from Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_files_bucket}",
          "arn:aws:s3:::${var.s3_files_bucket}/*"
        ]
      }
    ]
  })

  tags = var.tags
}

# DynamoDB access policy for Lambda
resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "${var.project_name}-lambda-dynamodb-${var.environment}"
  description = "IAM policy for DynamoDB access from Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table}",
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table}/index/*"
        ]
      }
    ]
  })

  tags = var.tags
}

# Cognito access policy for Lambda
resource "aws_iam_policy" "lambda_cognito_access" {
  name        = "${var.project_name}-lambda-cognito-${var.environment}"
  description = "IAM policy for Cognito access from Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:GetUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:ListUsers",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminListGroupsForUser"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# CloudWatch Logs policy for Lambda
resource "aws_iam_policy" "lambda_logs_access" {
  name        = "${var.project_name}-lambda-logs-${var.environment}"
  description = "IAM policy for CloudWatch Logs access from Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = var.tags
}

# Attach S3 policy to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_s3_access" {
  policy_arn = aws_iam_policy.lambda_s3_access.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Attach DynamoDB policy to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Attach Cognito policy to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_cognito_access" {
  policy_arn = aws_iam_policy.lambda_cognito_access.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Attach CloudWatch Logs policy to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_logs_access" {
  policy_arn = aws_iam_policy.lambda_logs_access.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# API Gateway CloudWatch Logs role
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "${var.project_name}-api-gateway-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project_name}-api-gateway-cloudwatch-${var.environment}"
    Description = "Role for API Gateway CloudWatch logging"
  })
}

# Attach CloudWatch policy to API Gateway role
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
}