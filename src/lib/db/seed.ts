/**
 * 初期データ投入スクリプト
 * 現在のハードコードデータをDBに移行するために使用
 *
 * 実行: npx tsx src/lib/db/seed.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";
import bcrypt from "bcryptjs";

const client = new RDSDataClient({ region: process.env.AWS_REGION });

const dbConfig = {
  resourceArn: process.env.AURORA_RESOURCE_ARN!,
  secretArn: process.env.AURORA_SECRET_ARN!,
  database: process.env.AURORA_DATABASE!,
};

async function executeSQL(sql: string, parameters?: { name: string; value: { stringValue: string } }[]) {
  const command = new ExecuteStatementCommand({
    ...dbConfig,
    sql,
    parameters,
  });
  return client.send(command);
}

const INITIAL_TENANTS = [
  { id: "tenant1", name: "Tenant 1" },
  { id: "tenant2", name: "Tenant 2" },
  { id: "tenant3", name: "Tenant 3" },
];

// デフォルトパスワード（開発環境用）
const DEFAULT_PASSWORD = "password";

const INITIAL_USERS: { email: string; name: string; tenants: string[] }[] = [
  { email: "admin@example.com", name: "Admin User", tenants: ["tenant1"] },
  { email: "devleadxaid@gmail.com", name: "Dev Lead", tenants: ["tenant1", "tenant2"] },
  { email: "lx-test-1@saixaid.com", name: "Test User 1", tenants: ["tenant1"] },
  { email: "user1@example.com", name: "User 1", tenants: ["tenant1"] },
  { email: "user2@example.com", name: "User 2", tenants: ["tenant2"] },
  { email: "user3@example.com", name: "User 3", tenants: ["tenant3"] },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // テナント作成
  console.log("Creating tenants...");
  for (const tenant of INITIAL_TENANTS) {
    try {
      await executeSQL(
        `INSERT INTO tenants (id, name) VALUES (:id, :name) ON CONFLICT (id) DO NOTHING`,
        [
          { name: "id", value: { stringValue: tenant.id } },
          { name: "name", value: { stringValue: tenant.name } },
        ]
      );
      console.log(`  ✅ Tenant ${tenant.id}`);
    } catch (error) {
      console.error(`  ❌ Tenant ${tenant.id}:`, error);
    }
  }

  // パスワードハッシュを事前に生成
  console.log("Generating password hash...");
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`  ✅ Password hash generated`);

  // ユーザーとテナント関連作成
  console.log("Creating users and associations...");
  for (const userData of INITIAL_USERS) {
    try {
      // ユーザー作成（既存の場合はパスワードハッシュを更新）
      const insertUserResult = await executeSQL(
        `INSERT INTO users (email, name, password_hash) VALUES (:email, :name, :passwordHash)
         ON CONFLICT (email) DO UPDATE SET password_hash = :passwordHash, name = :name
         RETURNING id`,
        [
          { name: "email", value: { stringValue: userData.email } },
          { name: "name", value: { stringValue: userData.name } },
          { name: "passwordHash", value: { stringValue: passwordHash } },
        ]
      );

      let userId: string;
      if (insertUserResult.records && insertUserResult.records.length > 0) {
        userId = insertUserResult.records[0][0].stringValue!;
      } else {
        // フォールバック（通常は到達しない）
        const existingUser = await executeSQL(
          `SELECT id FROM users WHERE email = :email`,
          [{ name: "email", value: { stringValue: userData.email } }]
        );
        userId = existingUser.records![0][0].stringValue!;
      }

      console.log(`  ✅ User ${userData.email} (${userId})`);

      // テナント関連作成
      for (const tenantId of userData.tenants) {
        await executeSQL(
          `INSERT INTO user_tenants (user_id, tenant_id) VALUES (:userId::uuid, :tenantId) ON CONFLICT (user_id, tenant_id) DO NOTHING`,
          [
            { name: "userId", value: { stringValue: userId } },
            { name: "tenantId", value: { stringValue: tenantId } },
          ]
        );
        console.log(`    ✅ Association ${userData.email} -> ${tenantId}`);
      }
    } catch (error) {
      console.error(`  ❌ User ${userData.email}:`, error);
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);
