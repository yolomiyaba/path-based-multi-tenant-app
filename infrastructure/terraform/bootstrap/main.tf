# Terraform State管理用のS3バケットとDynamoDBテーブルを作成
# このディレクトリは最初に一度だけ手動で適用する

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # bootstrap自体はローカルstateを使用
}

provider "aws" {
  region = "ap-northeast-1"

  default_tags {
    tags = {
      Project   = "leadxaid"
      ManagedBy = "terraform-bootstrap"
    }
  }
}

# S3バケット（Terraform state保存用）
resource "aws_s3_bucket" "terraform_state" {
  bucket = "leadxaid-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

# バージョニング有効化
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# サーバーサイド暗号化
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# パブリックアクセスブロック
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDBテーブル（state locking用）
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "leadxaid-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}

output "s3_bucket_name" {
  description = "Terraform state S3 bucket name"
  value       = aws_s3_bucket.terraform_state.id
}

output "s3_bucket_arn" {
  description = "Terraform state S3 bucket ARN"
  value       = aws_s3_bucket.terraform_state.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

# =============================================================================
# GitHub Actions OIDC Provider & IAM Role
# =============================================================================

# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub Actionsの証明書サムプリント（GitHubが管理）
  thumbprint_list = ["ffffffffffffffffffffffffffffffffffffffff"]
}

# GitHub Actions用IAMロール
resource "aws_iam_role" "github_actions" {
  name = "leadxaid-github-actions-terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:yolomiyaba/path-based-multi-tenant-app:*"
          }
        }
      }
    ]
  })
}

# AdministratorAccess ポリシーをアタッチ
# OIDCでリポジトリを制限しているため、セキュリティリスクは限定的
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "github_actions_role_arn" {
  description = "IAM Role ARN for GitHub Actions (set as AWS_ROLE_ARN secret)"
  value       = aws_iam_role.github_actions.arn
}
