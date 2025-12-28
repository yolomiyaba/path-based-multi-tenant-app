/**
 * Aurora Data API経由でテーブルを作成するスクリプト
 *
 * 実行: npx tsx src/lib/db/migrate.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

const client = new RDSDataClient({ region: process.env.AWS_REGION });

const dbConfig = {
  resourceArn: process.env.AURORA_RESOURCE_ARN!,
  secretArn: process.env.AURORA_SECRET_ARN!,
  database: process.env.AURORA_DATABASE!,
};

async function executeSQL(sql: string) {
  const command = new ExecuteStatementCommand({
    ...dbConfig,
    sql,
  });
  return client.send(command);
}

const migrations = [
  // テナントテーブル
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // ユーザーテーブル
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // ユーザー・テナント関連テーブル
  `CREATE TABLE IF NOT EXISTS user_tenants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, tenant_id)
  )`,

  // インデックス
  `CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

  // password_hashカラム追加（既存テーブルへのマイグレーション）
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,

  // email_verifiedカラム追加（メール認証用）
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP`,

  // メール認証トークンテーブル
  `CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // メール認証トークンのインデックス
  `CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token)`,
  `CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`,

  // テナント招待テーブル
  `CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // テナント招待のインデックス
  `CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token)`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email)`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id)`,
];

async function migrate() {
  console.log("🚀 Running migrations...");

  for (const sql of migrations) {
    try {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      await executeSQL(sql);
      console.log("✅ Success");
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }

  console.log("✅ All migrations completed!");
}

migrate().catch(console.error);
