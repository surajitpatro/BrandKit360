/**
 * Supabase Postgres schema — dialect port of db/schema.ts (MySQL/TiDB).
 *
 * Kept table-for-table and column-for-column identical so the Phase-6 data
 * migration is a straight row copy. Deliberate dialect decisions:
 *  - bigserial primary keys + bigint FK columns (MySQL's bigint→int FK
 *    references don't exist in Postgres; types must match exactly);
 *  - json → jsonb (superset, indexable, same $type payloads);
 *  - mysqlEnum → named PG enum types (order_status ≠ purchase_status);
 *  - identical table/column/index names — no query rewrites beyond dialect.
 *
 * This file is INERT until cutover: nothing in the running app imports it.
 */
import {
  pgTable,
  pgEnum,
  bigserial,
  bigint,
  integer,
  boolean,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import type { BrandData, PlanDeliverable } from "../../contracts/brand";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "completed", "failed", "refunded"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["completed", "refunded"]);

export const ASSET_TYPES = [
  "logo",
  "guidelines",
  "templates",
  "social",
  "presentation",
  "images",
  "downloads",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export const assetTypeEnum = pgEnum("asset_type", ASSET_TYPES);

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Supabase Auth user uuid (text form) — replaces the Kimi unionId at cutover */
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------- Plans & pricing ----------

export const plans = pgTable("plans", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  tagline: varchar("tagline", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  price: integer("price").notNull(), // minor units
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  comparePrice: integer("comparePrice"),
  badge: varchar("badge", { length: 64 }),
  deliverables: jsonb("deliverables").$type<PlanDeliverable[]>().notNull(),
  corePromise: varchar("corePromise", { length: 255 }).notNull(),
  whoFor: varchar("whoFor", { length: 255 }).notNull(),
  result: varchar("result", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sortOrder").notNull().default(0),
  /** configurable storage entitlement (MB) per plan; null = platform default */
  storageLimitMb: integer("storageLimitMb"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Plan = typeof plans.$inferSelect;

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("userId", { mode: "number" })
      .notNull()
      .references(() => users.id),
    planId: bigint("planId", { mode: "number" })
      .notNull()
      .references(() => plans.id),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("USD"),
    status: orderStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ userIdx: index("orders_user_idx").on(table.userId) }),
);

export type Order = typeof orders.$inferSelect;

export const purchases = pgTable(
  "purchases",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("userId", { mode: "number" })
      .notNull()
      .references(() => users.id),
    planId: bigint("planId", { mode: "number" })
      .notNull()
      .references(() => plans.id),
    orderId: bigint("orderId", { mode: "number" })
      .notNull()
      .references(() => orders.id),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("USD"),
    status: purchaseStatusEnum("status").notNull().default("completed"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ userIdx: index("purchases_user_idx").on(table.userId) }),
);

export type Purchase = typeof purchases.$inferSelect;

// ---------- Brands ----------

export const brands = pgTable(
  "brands",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("userId", { mode: "number" })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    business: varchar("business", { length: 255 }).notNull().default(""),
    data: jsonb("data").$type<BrandData>().notNull(),
    currentVersion: integer("currentVersion").notNull().default(1),
    portalEnabled: boolean("portalEnabled").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({ userIdx: index("brands_user_idx").on(table.userId) }),
);

export type Brand = typeof brands.$inferSelect;

export const brandVersions = pgTable(
  "brand_versions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    brandId: bigint("brandId", { mode: "number" })
      .notNull()
      .references(() => brands.id),
    version: integer("version").notNull(),
    label: varchar("label", { length: 128 }).notNull().default(""),
    data: jsonb("data").$type<BrandData>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ brandIdx: index("brand_versions_brand_idx").on(table.brandId) }),
);

export type BrandVersion = typeof brandVersions.$inferSelect;

// ---------- Stored file keys ----------

export const storedFiles = pgTable(
  "stored_files",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    key: varchar("key", { length: 512 }).notNull().unique(),
    ownerId: bigint("ownerId", { mode: "number" })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 512 }).notNull(),
    size: integer("size").notNull().default(0),
    purpose: varchar("purpose", { length: 64 }).notNull().default("logo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ ownerIdx: index("stored_files_owner_idx").on(table.ownerId) }),
);

export type StoredFile = typeof storedFiles.$inferSelect;

// ---------- Brand asset library ----------

export const brandAssets = pgTable(
  "brand_assets",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    brandId: bigint("brandId", { mode: "number" })
      .notNull()
      .references(() => brands.id),
    userId: bigint("userId", { mode: "number" })
      .notNull()
      .references(() => users.id),
    assetType: assetTypeEnum("assetType").notNull(),
    fileName: varchar("fileName", { length: 512 }).notNull(),
    /** provider-independent: "supabase" after cutover (was "tos") */
    storageProvider: varchar("storageProvider", { length: 32 }).notNull().default("supabase"),
    storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
    mimeType: varchar("mimeType", { length: 128 }).notNull().default("application/octet-stream"),
    fileSize: integer("fileSize").notNull().default(0),
    /** "upload" (owner-provided) or "ai" (generated in-product from brand tokens) */
    source: varchar("source", { length: 16 }).notNull().default("upload"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    brandIdx: index("brand_assets_brand_idx").on(table.brandId),
    userIdx: index("brand_assets_user_idx").on(table.userId),
  }),
);

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;
