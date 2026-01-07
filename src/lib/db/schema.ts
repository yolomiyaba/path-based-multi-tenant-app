import { pgTable, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// テナントテーブル
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ユーザーテーブル
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"), // OAuth専用ユーザーはnull
  emailVerified: timestamp("email_verified"), // メール認証完了日時（nullは未認証）
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// メール認証トークンテーブル
export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// テナント招待テーブル
export const tenantInvitations = pgTable("tenant_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").default("member").notNull(), // 招待時に付与するロール
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"), // 承認日時（nullは未承認）
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ユーザー・テナント関連テーブル（多対多）
export const userTenants = pgTable(
  "user_tenants",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.tenantId] }),
  ]
);

// ライセンスキーテーブル（テナント作成権限）
export const licenseKeys = pgTable("license_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // ライセンスキー（32文字以上のランダム文字列）
  email: text("email").notNull(), // 使用可能なメールアドレス
  plan: text("plan").default("standard").notNull(), // プラン名（standard, enterprise など）
  expiresAt: timestamp("expires_at").notNull(), // ライセンス有効期限
  usedAt: timestamp("used_at"), // 使用日時（nullは未使用）
  usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }), // 使用したユーザー
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ライセンスキーOTPテーブル（ワンタイムパスワード）
export const licenseKeyOtps = pgTable("license_key_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  licenseKeyId: uuid("license_key_id")
    .notNull()
    .references(() => licenseKeys.id, { onDelete: "cascade" }),
  otp: text("otp").notNull(), // 6桁のOTP
  expiresAt: timestamp("expires_at").notNull(), // OTP有効期限（10分程度）
  verifiedAt: timestamp("verified_at"), // 検証日時（nullは未検証）
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OAuth連携テーブル（メール・カレンダー連携用）
export const oauthConnections = pgTable("oauth_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // google, microsoft
  providerAccountId: text("provider_account_id").notNull(), // プロバイダー側のアカウントID
  email: text("email").notNull(), // 連携したアカウントのメールアドレス
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  scopes: text("scopes").notNull(), // カンマ区切りのスコープ（mail,calendar など）
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 課金セッションテーブル（Stripe連携用）
export const paymentSessions = pgTable("payment_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(), // 課金対象のメールアドレス
  sessionId: text("session_id").notNull().unique(), // Stripe Session ID
  plan: text("plan").default("standard").notNull(), // プラン名
  status: text("status").default("pending").notNull(), // pending, completed, expired
  completedAt: timestamp("completed_at"), // 課金完了日時
  expiresAt: timestamp("expires_at").notNull(), // セッション有効期限
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dummyTable = pgTable("dummy_table", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// リレーション定義
export const tenantsRelations = relations(tenants, ({ many }) => ({
  userTenants: many(userTenants),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userTenants: many(userTenants),
  oauthConnections: many(oauthConnections),
}));

export const oauthConnectionsRelations = relations(oauthConnections, ({ one }) => ({
  user: one(users, {
    fields: [oauthConnections.userId],
    references: [users.id],
  }),
}));

export const userTenantsRelations = relations(userTenants, ({ one }) => ({
  user: one(users, {
    fields: [userTenants.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [userTenants.tenantId],
    references: [tenants.id],
  }),
}));
