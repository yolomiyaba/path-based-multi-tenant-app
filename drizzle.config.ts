import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.AURORA_HOST || "localhost",
    port: 5432,
    user: process.env.AURORA_USER || "postgres",
    password: process.env.AURORA_PASSWORD || "",
    database: process.env.AURORA_DATABASE || "leadxaid",
    ssl: true,
  },
});
