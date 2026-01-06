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

## 注意事項

- `prevent_destroy = true` が設定されているため、誤削除を防止しています
- S3バケットはバージョニングと暗号化が有効です
- bootstrap自体のstateはローカルに保存されます（`.terraform/` 配下）
