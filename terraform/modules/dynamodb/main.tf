# DynamoDB table for file metadata and user permissions
resource "aws_dynamodb_table" "files_metadata" {
  name           = "${var.project_name}-files-${var.environment}"
  billing_mode   = var.billing_mode
  hash_key       = "pk"
  range_key      = "sk"

  # On-demand billing doesn't require capacity settings
  # read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  # write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  attribute {
    name = "gsi2pk"
    type = "S"
  }

  attribute {
    name = "gsi2sk"
    type = "S"
  }

  # GSI for querying files by owner
  global_secondary_index {
    name               = "GSI1"
    hash_key           = "gsi1pk"
    range_key          = "gsi1sk"
    projection_type    = "ALL"
  }

  # GSI for querying files by type/category
  global_secondary_index {
    name               = "GSI2"
    hash_key           = "gsi2pk"
    range_key          = "gsi2sk"
    projection_type    = "ALL"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Deletion protection for production
  deletion_protection_enabled = var.environment == "prod" ? true : false

  tags = merge(var.tags, {
    Name        = "${var.project_name}-files-${var.environment}"
    Description = "File metadata and user permissions storage"
  })
}

# DynamoDB table for user sessions (optional, for enhanced security)
resource "aws_dynamodb_table" "user_sessions" {
  name           = "${var.project_name}-sessions-${var.environment}"
  billing_mode   = var.billing_mode
  hash_key       = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  # GSI for querying sessions by user
  global_secondary_index {
    name               = "UserIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
  }

  # TTL for automatic session cleanup
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Deletion protection for production
  deletion_protection_enabled = var.environment == "prod" ? true : false

  tags = merge(var.tags, {
    Name        = "${var.project_name}-sessions-${var.environment}"
    Description = "User session management"
  })
}