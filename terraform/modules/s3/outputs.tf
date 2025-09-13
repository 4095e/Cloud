output "files_bucket_name" {
  description = "Name of the S3 bucket for file storage"
  value       = aws_s3_bucket.files.bucket
}

output "files_bucket_arn" {
  description = "ARN of the S3 bucket for file storage"
  value       = aws_s3_bucket.files.arn
}

output "files_bucket_domain_name" {
  description = "Domain name of the S3 bucket for file storage"
  value       = aws_s3_bucket.files.bucket_domain_name
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "ARN of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_domain_name" {
  description = "Domain name of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "frontend_bucket_website_endpoint" {
  description = "Website endpoint of the S3 bucket for frontend hosting"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}