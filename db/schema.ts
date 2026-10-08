import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  int,
  boolean,
  varchar,
  text,
  json,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import type { BrandData, PlanDeliverable } from "../contracts/brand";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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

export const plans = mysqlTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  tagline: varchar("tagline", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  price: int("price").notNull(), // minor units (paise)
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  comparePrice: int("comparePrice"),
  badge: varchar("badge", { length: 64 }),
  deliverables: json("deliverables").$type<PlanDeliverable[]>().notNull(),
  corePromise: varchar("corePromise", { length: 255 }).notNull(),
  whoFor: varchar("whoFor", { length: 255 }).notNull(),
  result: varchar("result", { length: 255 }).notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: int("sortOrder").notNull().default(0),
  /** §10 — configurable storage entitlement (MB) per plan; null = platform default. */
  storageLimitMb: int("storageLimitMb"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Plan = typeof plans.$inferSelect;

export const orders = mysqlTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    planId: bigint("planId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => plans.id),
    amount: int("amount").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
      .notNull()
      .default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ userIdx: index("orders_user_idx").on(table.userId) }),
);

export type Order = typeof orders.$inferSelect;

export const purchases = mysqlTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    planId: bigint("planId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => plans.id),
    orderId: bigint("orderId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => orders.id),
    amount: int("amount").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: mysqlEnum("status", ["completed", "refunded"]).notNull().default("completed"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ userIdx: index("purchases_user_idx").on(table.userId) }),
);

export type Purchase = typeof purchases.$inferSelect;

// ---------- Brands ----------

export const brands = mysqlTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    business: varchar("business", { length: 255 }).notNull().default(""),
    data: json("data").$type<BrandData>().notNull(),
    currentVersion: int("currentVersion").notNull().default(1),
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

export const brandVersions = mysqlTable(
  "brand_versions",
  {
    id: serial("id").primaryKey(),
    brandId: bigint("brandId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => brands.id),
    version: int("version").notNull(),
    label: varchar("label", { length: 128 }).notNull().default(""),
    data: json("data").$type<BrandData>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ brandIdx: index("brand_versions_brand_idx").on(table.brandId) }),
);

export type BrandVersion = typeof brandVersions.$inferSelect;

// ---------- Stored file keys (logo assets etc.) ----------

export const storedFiles = mysqlTable(
  "stored_files",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 512 }).notNull().unique(),
    ownerId: bigint("ownerId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 512 }).notNull(),
    size: int("size").notNull().default(0),
    purpose: varchar("purpose", { length: 64 }).notNull().default("logo"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({ ownerIdx: index("stored_files_owner_idx").on(table.ownerId) }),
);

export type StoredFile = typeof storedFiles.$inferSelect;

// ---------- Brand asset library (spec §6 — metadata in DB, files in object storage) ----------

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

export const brandAssets = mysqlTable(
  "brand_assets",
  {
    id: serial("id").primaryKey(),
    brandId: bigint("brandId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => brands.id),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    assetType: mysqlEnum("assetType", ASSET_TYPES).notNull(),
    fileName: varchar("fileName", { length: 512 }).notNull(),
    /** provider-independent: "tos" today, swappable for "r2"/"s3" later without schema change */
    storageProvider: varchar("storageProvider", { length: 32 }).notNull().default("tos"),
    storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
    mimeType: varchar("mimeType", { length: 128 }).notNull().default("application/octet-stream"),
    fileSize: int("fileSize").notNull().default(0),
    /** "upload" (owner-provided) or "ai" (generated in-product from brand tokens) */
    source: varchar("source", { length: 16 }).notNull().default("upload"),
    version: int("version").notNull().default(1),
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
