# LeadXAid - Path-Based Multi-Tenant App

パスベースのマルチテナント対応 SaaS アプリケーション

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| 認証 | NextAuth.js 4 |
| DB | AWS Aurora Serverless v2 (PostgreSQL) |
| ORM | Drizzle ORM |
| スタイリング | Tailwind CSS 4 |
| インフラ | Terraform, AWS |
| ホスティング | Vercel |
| CI/CD | GitHub Actions |

## ディレクトリ構成

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [tenantId]/         # テナント別ページ（動的ルート）
│   │   ├── api/                # API エンドポイント
│   │   ├── auth/               # グローバル認証ページ
│   │   ├── profile/            # ユーザープロフィール
│   │   └── tenants/            # テナント一覧
│   ├── components/             # React コンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/
│   │   ├── db/                 # DB スキーマ・接続・マイグレーション
│   │   ├── auth/               # 認証ロジック
│   │   ├── oauth/              # OAuth クライアント
│   │   └── email/              # メール送信
│   └── types/                  # 型定義
├── scripts/                    # 管理スクリプト（CI専用）
├── drizzle/                    # マイグレーションファイル
├── infrastructure/
│   └── terraform/
│       ├── bootstrap/          # 初期設定（S3, IAM）
│       ├── environments/dev/   # 開発環境
│       └── modules/            # 再利用モジュール
└── .github/workflows/          # CI/CD ワークフロー
```

## インフラ構成

### AWS リソース

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS (ap-northeast-1)                  │
│                                                              │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │   S3 Bucket      │     │   Aurora Serverless v2       │  │
│  │   (Terraform     │     │   (PostgreSQL)               │  │
│  │    State)        │     │                              │  │
│  └──────────────────┘     │   - Data API 有効            │  │
│                            │   - 0.5-4 ACU (自動スケール) │  │
│  ┌──────────────────┐     │   - VPC 内配置               │  │
│  │   DynamoDB       │     └──────────────────────────────┘  │
│  │   (State Lock)   │                                       │
│  └──────────────────┘     ┌──────────────────────────────┐  │
│                            │   Secrets Manager            │  │
│  ┌──────────────────┐     │   (DB認証情報)               │  │
│  │   IAM Role       │     └──────────────────────────────┘  │
│  │   (GitHub OIDC)  │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
            ↑                              ↑
            │ OIDC認証                     │ Data API
            │                              │
┌───────────┴───────────┐    ┌─────────────┴─────────────┐
│   GitHub Actions      │    │   Vercel                   │
│   - Terraform         │    │   - Next.js アプリ         │
│   - Migration         │    │   - IAM User 経由でDB接続  │
│   - Admin Scripts     │    └───────────────────────────┘
└───────────────────────┘
```

### Terraform 構成

| ディレクトリ | 用途 |
|-------------|------|
| `bootstrap/` | S3バケット、DynamoDB、GitHub Actions用IAMロール |
| `environments/dev/` | Aurora Serverless、VPC、Vercel用IAMユーザー |
| `modules/aurora-serverless/` | Aurora クラスター再利用モジュール |

## CI/CD

### GitHub Actions ワークフロー

| ワークフロー | トリガー | 用途 |
|-------------|---------|------|
| `terraform.yml` | `infrastructure/**` 変更時、PR | インフラ Plan/Apply |
| `migration.yml` | `drizzle/**` 変更時、手動 | DBマイグレーション |
| `admin-scripts.yml` | 手動のみ | 管理スクリプト実行 |

### CI でのみ実行可能な操作

以下の操作はローカルからの実行が阻止され、GitHub Actions からのみ実行可能です：

| 操作 | スクリプト | ワークフロー |
|------|-----------|-------------|
| DBマイグレーション | `npm run db:migrate` | `migration.yml` |
| ライセンスキー発行 | `scripts/create-license-key.ts` | `admin-scripts.yml` |
| ユーザー削除 | `scripts/delete-user.ts` | `admin-scripts.yml` |
| テナント削除 | `scripts/delete-tenant.ts` | `admin-scripts.yml` |

#### 管理スクリプトの実行方法

1. GitHub → Actions → "Admin Scripts"
2. "Run workflow" をクリック
3. スクリプトとパラメータを入力して実行

## 機能一覧

### 認証・認可

- **ローカル認証**: メール/パスワード + メール認証
- **OAuth**: Google, Microsoft
- **ライセンスキー**: テナント作成権限の付与
- **招待システム**: 既存テナントへのメンバー招待

### マルチテナント

- **パスベースルーティング**: `/{tenantId}/dashboard`
- **テナント切り替え**: 複数テナント所属時に選択可能
- **ロールベースアクセス制御**: admin / member

### 外部連携

- **Google**: Gmail 読み取り、カレンダー連携
- **Microsoft**: OAuth 認証
- **Stripe**: 決済セッション（モック実装あり）
- **Mailgun**: メール送信

## データベーススキーマ

```
tenants ─────────┐
                 │ 1:N
user_tenants ────┤──── users ────┬── oauth_connections
                 │               │
tenant_invitations               ├── email_verifications
                                 │
license_keys ─── license_key_otps

payment_sessions (独立)
```

| テーブル | 説明 |
|---------|------|
| `tenants` | テナント情報 |
| `users` | ユーザー情報 |
| `user_tenants` | ユーザー・テナント関連（多対多） |
| `tenant_invitations` | テナント招待 |
| `oauth_connections` | OAuth 連携情報 |
| `email_verifications` | メール認証トークン |
| `license_keys` | ライセンスキー |
| `license_key_otps` | ライセンスキー OTP |
| `payment_sessions` | 決済セッション |

## 開発

### ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### 環境変数

`.env.local` に以下を設定：

```bash
# AWS（ローカルでアプリを動かす場合に必要）
AWS_REGION=ap-northeast-1
AURORA_RESOURCE_ARN=arn:aws:rds:...
AURORA_SECRET_ARN=arn:aws:secretsmanager:...
AURORA_DATABASE=leadxaid

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# Mailgun
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
```

### npm スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint 実行 |
| `npm run db:generate` | マイグレーションファイル生成 |

### マイグレーションの流れ

1. `src/lib/db/schema.ts` を編集
2. `npm run db:generate` でマイグレーションファイル生成
3. `drizzle/` 配下の変更をコミット・プッシュ
4. main ブランチへのマージで自動適用

## セットアップ

### 初回セットアップ

1. **Bootstrap の適用**（ローカル）
   ```bash
   cd infrastructure/terraform/bootstrap
   terraform init
   terraform apply
   ```

2. **GitHub Secrets の設定**
   - `AWS_ROLE_ARN`: bootstrap の出力値
   - `AURORA_RESOURCE_ARN`: dev 環境の出力値
   - `AURORA_SECRET_ARN`: dev 環境の出力値
   - `AURORA_DATABASE`: `leadxaid`

3. **Vercel の設定**
   - IAM ユーザーの認証情報を環境変数に設定
   - Aurora 接続情報を環境変数に設定