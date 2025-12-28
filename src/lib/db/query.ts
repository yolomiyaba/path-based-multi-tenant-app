/**
 * DBクエリ実行スクリプト
 *
 * 使用例:
 *   npx tsx src/lib/db/query.ts "SELECT * FROM tenants"
 *   npx tsx src/lib/db/query.ts "SELECT id, email, name FROM users"
 *   npx tsx src/lib/db/query.ts "SELECT * FROM user_tenants"
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

async function query(sql: string) {
  console.log(`📋 Executing: ${sql}\n`);

  const command = new ExecuteStatementCommand({
    ...dbConfig,
    sql,
    includeResultMetadata: true,
  });

  const result = await client.send(command);

  if (!result.records || result.records.length === 0) {
    console.log("(no results)");
    return;
  }

  // カラム名を取得
  const columns = result.columnMetadata?.map((c) => c.name || "?") || [];
  console.log(columns.join("\t|\t"));
  console.log("-".repeat(columns.length * 20));

  // 各レコードを表示
  for (const record of result.records) {
    const values = record.map((field) => {
      if (field.stringValue !== undefined) return field.stringValue;
      if (field.longValue !== undefined) return field.longValue;
      if (field.booleanValue !== undefined) return field.booleanValue;
      if (field.isNull) return "NULL";
      return JSON.stringify(field);
    });
    console.log(values.join("\t|\t"));
  }

  console.log(`\n✅ ${result.records.length} row(s)`);
}

const sql = process.argv[2];
if (!sql) {
  console.log("Usage: npx tsx src/lib/db/query.ts \"SELECT * FROM tenants\"");
  process.exit(1);
}

query(sql).catch(console.error);
