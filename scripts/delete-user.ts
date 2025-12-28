/**
 * ユーザー削除スクリプト
 * 使用方法: npx tsx scripts/delete-user.ts <email> [--force]
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { users, userTenants, tenantInvitations, licenseKeys } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  const forceFlag = process.argv.includes("--force");

  if (!email) {
    console.error("使用方法: npx tsx scripts/delete-user.ts <email> [--force]");
    console.error("例: npx tsx scripts/delete-user.ts user@example.com");
    console.error("    npx tsx scripts/delete-user.ts user@example.com --force");
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
    // ユーザー存在確認
    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (user.length === 0) {
      console.error(`❌ ユーザー "${email}" が見つかりません`);
      process.exit(1);
    }

    const userId = user[0].id;

    // 所属テナント数を取得
    const tenantMemberships = await db.select().from(userTenants).where(eq(userTenants.userId, userId));

    // 招待した数を取得
    const invitations = await db.select().from(tenantInvitations).where(eq(tenantInvitations.invitedBy, userId));

    // 使用したライセンスキー数を取得
    const usedLicenses = await db.select().from(licenseKeys).where(eq(licenseKeys.usedBy, userId));

    console.log(`\nユーザー情報:`);
    console.log("━".repeat(50));
    console.log(`  ID: ${user[0].id}`);
    console.log(`  メール: ${user[0].email}`);
    console.log(`  名前: ${user[0].name || "(未設定)"}`);
    console.log(`  メール認証: ${user[0].emailVerified ? "✓ 認証済み" : "✗ 未認証"}`);
    console.log(`  作成日: ${user[0].createdAt}`);
    console.log(`  所属テナント数: ${tenantMemberships.length}`);
    if (tenantMemberships.length > 0) {
      console.log(`    テナントID: ${tenantMemberships.map(m => m.tenantId).join(", ")}`);
    }
    console.log(`  招待した数: ${invitations.length}`);
    console.log(`  使用ライセンスキー数: ${usedLicenses.length}`);
    console.log("━".repeat(50));

    if (!forceFlag) {
      console.log("\n⚠️  このユーザーを削除すると、以下も削除されます:");
      console.log("  - ユーザーとテナントの関連付け（user_tenants）");
      console.log("  - このユーザーが送信した招待（tenant_invitations）");
      console.log("  - ライセンスキーの使用者情報はnullに設定されます");
      console.log("\n削除を実行するには --force オプションを付けてください:");
      console.log(`  npx tsx scripts/delete-user.ts ${email} --force`);
      process.exit(0);
    }

    // 削除実行
    console.log("\n削除中...");

    // 招待を明示的に削除（CASCADE が効かない場合の対応）
    if (invitations.length > 0) {
      console.log(`  招待を削除中... (${invitations.length}件)`);
      await db.delete(tenantInvitations).where(eq(tenantInvitations.invitedBy, userId));
    }

    // ユーザーを削除
    await db.delete(users).where(eq(users.id, userId));

    console.log(`\n✅ ユーザー "${email}" を削除しました`);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
