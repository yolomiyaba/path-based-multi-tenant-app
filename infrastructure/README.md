# Infrastructure

このディレクトリには、LeadXAidアプリケーションのインフラストラクチャ（Terraform）が含まれています。

## 構成

```
infrastructure/
└── terraform/
    ├── modules/
    │   └── aurora-serverless/    # Aurora Serverless v2モジュール
    └── environments/
        └── dev/                   # 開発環境
```

## 前提条件

- Terraform >= 1.0
- AWS CLI（認証済み）
- 既存のVPC・サブネット

## セットアップ

### 1. AWS認証

```bash
aws login
# または
export AWS_PROFILE=your-profile
```

### 2. Terraformの初期化

```bash
cd infrastructure/terraform/environments/dev
terraform init
```

### 3. 設定の確認・変更

`terraform.tfvars` を確認し、必要に応じて変更してください。

### 4. プレビュー

```bash
terraform plan
```

### 5. 適用

```bash
terraform apply
```

## 作成されるリソース

- **Aurora Serverless v2** (PostgreSQL 16.x)
  - Data API有効
  - Secrets Managerで認証情報管理
- **IAMユーザー** (Vercel用)
  - Aurora Data APIへのアクセス権限

## 出力値

適用後、以下のコマンドで環境変数を確認できます：

```bash
# Next.js用の環境変数
terraform output next_js_env_example

# Vercel用のAWS認証情報
terraform output vercel_aws_access_key_id
terraform output -raw vercel_aws_secret_access_key
```

## Vercel環境変数

Vercelに以下の環境変数を設定してください：

| 変数名 | 取得方法 |
|--------|----------|
| `AURORA_RESOURCE_ARN` | `terraform output aurora_cluster_arn` |
| `AURORA_SECRET_ARN` | `terraform output aurora_secret_arn` |
| `AURORA_DATABASE` | `terraform output aurora_database_name` |
| `AWS_REGION` | `ap-northeast-1` |
| `AWS_ACCESS_KEY_ID` | `terraform output vercel_aws_access_key_id` |
| `AWS_SECRET_ACCESS_KEY` | `terraform output -raw vercel_aws_secret_access_key` |

## データベース操作

```bash
# テーブル作成
npm run db:migrate

# 初期データ投入
npm run db:seed
```

## 削除

```bash
terraform destroy
```

**注意**: 本番環境では `skip_final_snapshot = false` に設定し、削除前にスナップショットを取得してください。
