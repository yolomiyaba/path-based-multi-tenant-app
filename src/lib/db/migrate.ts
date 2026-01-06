/**
 * Aurora Data API経由でマイグレーションを実行するスクリプト
 *
 * 実行: npm run db:migrate
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { migrate } from "drizzle-orm/aws-data-api/pg/migrator";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import * as schema from "./schema";

async function main() {
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
