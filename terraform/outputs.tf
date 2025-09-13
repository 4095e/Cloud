output "s3_files_bucket_name" {
  description = "Name of the S3 bucket for file storage"
  value       = module.s3.files_bucket_name
}

output "s3_frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = module.s3.frontend_bucket_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.dynamodb.table_name
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.cognito.user_pool_client_id
  sensitive   = true
}

output "cognito_identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = module.cognito.identity_pool_id
}

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = module.api_gateway.api_gateway_url
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

# Environment configuration for frontend
output "frontend_config" {
  description = "Configuration values for the frontend application"
  value = {
    apiUrl               = module.api_gateway.api_gateway_url
    region               = var.region
    cognitoUserPoolId    = module.cognito.user_pool_id
    cognitoUserPoolClientId = module.cognito.user_pool_client_id
    cognitoIdentityPoolId   = module.cognito.identity_pool_id
    s3FilesBucket        = module.s3.files_bucket_name
    cloudfrontDomain     = module.cloudfront.domain_name
  }
  sensitive = true
}