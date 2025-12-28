terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # 本番環境ではS3バックエンドを使用することを推奨
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "leadxaid/dev/terraform.tfstate"
  #   region = "ap-northeast-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "leadxaid"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "aurora" {
  source = "../../modules/aurora-serverless"

  cluster_name = "leadxaid-${var.environment}"
  environment  = var.environment

  vpc_id     = var.vpc_id
  vpc_cidr   = var.vpc_cidr
  subnet_ids = var.private_subnet_ids

  database_name   = "leadxaid"
  master_username = "postgres"
  engine_version  = "16.4"

  min_capacity = 0.5  # 最小コスト
  max_capacity = 4    # 開発環境は控えめに

  instance_count      = 1
  skip_final_snapshot = true  # 開発環境のみtrue
}

# Vercel用IAMユーザー（Aurora Data APIアクセス用）
resource "aws_iam_user" "vercel" {
  name = "leadxaid-${var.environment}-vercel"
}

resource "aws_iam_user_policy" "vercel_aurora" {
  name = "aurora-data-api-access"
  user = aws_iam_user.vercel.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement"
        ]
        Resource = module.aurora.cluster_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = module.aurora.master_user_secret_arn
      }
    ]
  })
}

resource "aws_iam_access_key" "vercel" {
  user = aws_iam_user.vercel.name
}
