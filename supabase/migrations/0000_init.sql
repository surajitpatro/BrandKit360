CREATE TYPE "public"."asset_type" AS ENUM('logo', 'guidelines', 'templates', 'social', 'presentation', 'images', 'downloads');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('completed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "brand_assets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"brandId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"assetType" "asset_type" NOT NULL,
	"fileName" varchar(512) NOT NULL,
	"storageProvider" varchar(32) DEFAULT 'supabase' NOT NULL,
	"storageKey" varchar(512) NOT NULL,
	"mimeType" varchar(128) DEFAULT 'application/octet-stream' NOT NULL,
	"fileSize" integer DEFAULT 0 NOT NULL,
	"source" varchar(16) DEFAULT 'upload' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_assets_storageKey_unique" UNIQUE("storageKey")
);
--> statement-breakpoint
CREATE TABLE "brand_versions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"brandId" bigint NOT NULL,
	"version" integer NOT NULL,
	"label" varchar(128) DEFAULT '' NOT NULL,
	"data" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"business" varchar(255) DEFAULT '' NOT NULL,
	"data" jsonb NOT NULL,
	"currentVersion" integer DEFAULT 1 NOT NULL,
	"portalEnabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"planId" bigint NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"tagline" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"comparePrice" integer,
	"badge" varchar(64),
	"deliverables" jsonb NOT NULL,
	"corePromise" varchar(255) NOT NULL,
	"whoFor" varchar(255) NOT NULL,
	"result" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"storageLimitMb" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" bigint NOT NULL,
	"planId" bigint NOT NULL,
	"orderId" bigint NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"status" "purchase_status" DEFAULT 'completed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stored_files" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"key" varchar(512) NOT NULL,
	"ownerId" bigint NOT NULL,
	"name" varchar(512) NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"purpose" varchar(64) DEFAULT 'logo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stored_files_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"unionId" varchar(255) NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"avatar" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignInAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_unionId_unique" UNIQUE("unionId")
);
--> statement-breakpoint
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_brandId_brands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_versions" ADD CONSTRAINT "brand_versions_brandId_brands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_planId_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_planId_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_assets_brand_idx" ON "brand_assets" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "brand_assets_user_idx" ON "brand_assets" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "brand_versions_brand_idx" ON "brand_versions" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "brands_user_idx" ON "brands" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "stored_files_owner_idx" ON "stored_files" USING btree ("ownerId");