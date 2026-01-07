/**
 * Aurora Data API経由でマイグレーションを実行するスクリプト
 *
 * CI/CD環境でのみ実行可能（GitHub Actions）
 * ローカルからの実行は阻止される
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { migrate } from "drizzle-orm/aws-data-api/pg/migrator";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "./schema";

async function main() {
  // CI環境チェック（GitHub Actionsでは CI=true が自動設定される）
  if (!process.env.CI) {
    console.error("❌ Migration can only be run in CI/CD environment.");
    console.error("   Push changes to main branch to trigger migration.");
    process.exit(1);
  }

  console.log("🚀 Starting migration...");

  const client = new RDSDataClient({
    region: process.env.AWS_REGION || "ap-northeast-1",
  });

  const db = drizzle(client, {
    resourceArn: process.env.AURORA_RESOURCE_ARN!,
    secretArn: process.env.AURORA_SECRET_ARN!,
    database: process.env.AURORA_DATABASE!,
    schema,
  });

  console.log(`  Database: ${process.env.AURORA_DATABASE}`);
  console.log(`  Migrations folder: ./drizzle`);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
