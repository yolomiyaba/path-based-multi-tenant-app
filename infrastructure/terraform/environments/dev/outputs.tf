# Next.js環境変数として使用する値

output "aurora_cluster_arn" {
  description = "Aurora cluster ARN (AURORA_RESOURCE_ARN)"
  value       = module.aurora.cluster_arn
}

output "aurora_secret_arn" {
  description = "Secrets Manager secret ARN (AURORA_SECRET_ARN)"
  value       = module.aurora.master_user_secret_arn
}

output "aurora_database_name" {
  description = "Database name (AURORA_DATABASE)"
  value       = module.aurora.database_name
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint (for direct connection if needed)"
  value       = module.aurora.cluster_endpoint
}

output "next_js_env_example" {
  description = "Example .env.local content for Next.js"
  value       = <<-EOT
    # Aurora Data API configuration
    AURORA_RESOURCE_ARN=${module.aurora.cluster_arn}
    AURORA_SECRET_ARN=${module.aurora.master_user_secret_arn}
    AURORA_DATABASE=${module.aurora.database_name}
    AWS_REGION=ap-northeast-1
  EOT
}

# Vercel用IAM認証情報
output "vercel_aws_access_key_id" {
  description = "AWS Access Key ID for Vercel"
  value       = aws_iam_access_key.vercel.id
}

output "vercel_aws_secret_access_key" {
  description = "AWS Secret Access Key for Vercel"
  value       = aws_iam_access_key.vercel.secret
  sensitive   = true
}
