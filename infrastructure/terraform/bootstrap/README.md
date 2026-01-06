# Terraform Bootstrap

Terraform stateを管理するためのS3バケットとDynamoDBテーブルを作成します。

## 初回セットアップ手順

1. AWSクレデンシャルを設定

```bash
export AWS_PROFILE=your-profile
# または
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
```

2. bootstrapを適用

```bash
cd infrastructure/terraform/bootstrap
terraform init
terraform plan
terraform apply
```

3. 各環境のbackendを初期化

```bash
cd ../environments/dev
terraform init
```

既存のローカルstateがある場合、S3への移行を確認されます。「yes」と入力してください。

## 作成されるリソース

| リソース | 名前 | 用途 |
|---------|------|------|
| S3バケット | leadxaid-terraform-state | stateファイル保存 |
| DynamoDBテーブル | leadxaid-terraform-locks | state locking |
| OIDC Provider | token.actions.githubusercontent.com | GitHub Actions認証 |
| IAM Role | leadxaid-github-actions-terraform | CI/CD用ロール |

## GitHub Actions設定

bootstrap適用後、出力される `github_actions_role_arn` をGitHubリポジトリのSecretsに設定:

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. `AWS_ROLE_ARN` として Role ARN を追加

```bash
# 出力例
terraform output github_actions_role_arn
# arn:aws:iam::123456789012:role/leadxaid-github-actions-terraform
```

## 注意事項

- `prevent_destroy = true` が設定されているため、誤削除を防止しています
- S3バケットはバージョニングと暗号化が有効です
- bootstrap自体のstateはローカルに保存されます（`.terraform/` 配下）
- GitHub Actions IAMロールは `yolomiyaba/path-based-multi-tenant-app` リポジトリからのみ使用可能
