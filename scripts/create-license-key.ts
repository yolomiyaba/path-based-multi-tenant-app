/**
 * ライセンスキー発行スクリプト
 * CI/CD環境でのみ実行可能（GitHub Actions）
 *
 * 使用方法: GitHub Actions の "Admin Scripts" ワークフローから実行
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { licenseKeys } from "../src/lib/db/schema";
import { randomBytes } from "crypto";

function generateLicenseKey(): string {
  return randomBytes(16).toString("hex");
}

async function main() {
  // CI環境チェック
  if (!process.env.CI) {
    console.error("❌ このスクリプトはCI/CD環境でのみ実行可能です。");
    console.error("   GitHub Actions の 'Admin Scripts' ワークフローから実行してください。");
    process.exit(1);
  }

  const email = process.argv[2];
  const plan = process.argv[3] || "standard";
  const expiresInDays = parseInt(process.argv[4] || "365", 10);

  if (!email) {
    console.error("使用方法: npx tsx scripts/create-license-key.ts <email> [plan] [expiresInDays]");
    console.error("例: npx tsx scripts/create-license-key.ts test@example.com standard 365");
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

  console.log(`ライセンスキーを発行中...`);
  console.log(`  メール: ${email}`);
  console.log(`  プラン: ${plan}`);
  console.log(`  有効期間: ${expiresInDays}日`);

  try {
    const code = generateLicenseKey();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await db.insert(licenseKeys).values({
      code,
      email: email.toLowerCase(),
      plan,
      expiresAt,
    });

    console.log("\n✅ ライセンスキーが発行されました:");
    console.log("━".repeat(50));
    console.log(`  コード: ${code}`);
    console.log(`  有効期限: ${expiresAt.toISOString()}`);
    console.log("━".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
