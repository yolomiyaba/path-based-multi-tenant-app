/**
 * テナント削除スクリプト
 * 使用方法: npx tsx scripts/delete-tenant.ts <tenantId> [--force]
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { tenants, userTenants } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const tenantId = process.argv[2];
  const forceFlag = process.argv.includes("--force");

  if (!tenantId) {
    console.error("使用方法: npx tsx scripts/delete-tenant.ts <tenantId> [--force]");
    console.error("例: npx tsx scripts/delete-tenant.ts my-tenant");
    console.error("    npx tsx scripts/delete-tenant.ts my-tenant --force");
    process.exit(1);
  }

  // 環境変数確認
  if (!process.env.AURORA_RESOURCE_ARN || !process.env.AURORA_SECRET_ARN || !process.env.AURORA_DATABASE) {
    console.error("❌ 環境変数が設定されていません:");
    console.error("  AURORA_RESOURCE_ARN:", process.env.AURORA_RESOURCE_ARN ? "✓" : "✗");
    console.error("  AURORA_SECRET_ARN:", process.env.AURORA_SECRET_ARN ? "✓" : "✗");
    console.error("  AURORA_DATABASE:", process.env.AURORA_DATABASE ? "✓" : "✗");
    process.exit(1);
  }

  // DBクライアント初期化
  const client = new RDSDataClient({ region: process.env.AWS_REGION });
  const db = drizzle(client, {
    resourceArn: process.env.AURORA_RESOURCE_ARN,
    secretArn: process.env.AURORA_SECRET_ARN,
    database: process.env.AURORA_DATABASE,
  });

  try {
    // テナント存在確認
    const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId));

    if (tenant.length === 0) {
      console.error(`❌ テナント "${tenantId}" が見つかりません`);
      process.exit(1);
    }

    // メンバー数を取得
    const members = await db.select().from(userTenants).where(eq(userTenants.tenantId, tenantId));

    console.log(`\nテナント情報:`);
    console.log("━".repeat(50));
    console.log(`  ID: ${tenant[0].id}`);
    console.log(`  名前: ${tenant[0].name}`);
    console.log(`  作成日: ${tenant[0].createdAt}`);
    console.log(`  メンバー数: ${members.length}人`);
    console.log("━".repeat(50));

    if (!forceFlag) {
      console.log("\n⚠️  このテナントを削除すると、以下も削除されます:");
      console.log("  - テナントへの招待");
      console.log("  - ユーザーとテナントの関連付け");
      console.log("\n削除を実行するには --force オプションを付けてください:");
      console.log(`  npx tsx scripts/delete-tenant.ts ${tenantId} --force`);
      process.exit(0);
    }

    // 削除実行
    console.log("\n削除中...");
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    console.log(`\n✅ テナント "${tenantId}" を削除しました`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
