output "auth_function_arn" {
  description = "ARN of the auth Lambda function"
  value       = aws_lambda_function.auth.arn
}

output "auth_function_name" {
  description = "Name of the auth Lambda function"
  value       = aws_lambda_function.auth.function_name
}

output "files_function_arn" {
  description = "ARN of the files Lambda function"
  value       = aws_lambda_function.files.arn
}

output "files_function_name" {
  description = "Name of the files Lambda function"
  value       = aws_lambda_function.files.function_name
}

output "users_function_arn" {
  description = "ARN of the users Lambda function"
  value       = aws_lambda_function.users.arn
}

output "users_function_name" {
  description = "Name of the users Lambda function"
  value       = aws_lambda_function.users.function_name
}