output "table_name" {
  description = "Name of the DynamoDB table for file metadata"
  value       = aws_dynamodb_table.files_metadata.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table for file metadata"
  value       = aws_dynamodb_table.files_metadata.arn
}

output "sessions_table_name" {
  description = "Name of the DynamoDB table for user sessions"
  value       = aws_dynamodb_table.user_sessions.name
}

output "sessions_table_arn" {
  description = "ARN of the DynamoDB table for user sessions"
  value       = aws_dynamodb_table.user_sessions.arn
}