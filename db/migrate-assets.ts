/**
 * §6 migration: move existing stored_files rows (logo uploads) into the
 * brand_assets model, linking each file to its brand via data.logo.assetKey.
 * Idempotent — skips rows whose storageKey already exists.
 * Run: npx tsx -r dotenv/config db/migrate-assets.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { brandAssets, brands, storedFiles } from "./schema";

async function run() {
  const db = getDb();
  const files = await db.select().from(storedFiles);
  const allBrands = await db.select({ id: brands.id, userId: brands.userId, data: brands.data }).from(brands);

  // brandId lookup by logo assetKey (old upload flow stored it in brand data)
  const brandByKey = new Map<string, { brandId: number; userId: number }>();
  for (const b of allBrands) {
    const key = b.data?.logo?.assetKey;
    if (key) brandByKey.set(key, { brandId: b.id, userId: b.userId });
  }

  let migrated = 0;
  let skipped = 0;
  let orphaned = 0;
  for (const f of files) {
    const existing = await db.query.brandAssets.findFirst({
      where: eq(brandAssets.storageKey, f.key),
    });
    if (existing) {
      skipped++;
      continue;
    }
    const link = brandByKey.get(f.key);
    if (!link) {
      orphaned++; // no brand references this file; leave the row for manual review
      continue;
    }
    await db.insert(brandAssets).values({
      brandId: link.brandId,
      userId: link.userId,
      assetType: "logo",
      fileName: f.name,
      storageProvider: "tos",
      storageKey: f.key,
      mimeType: "application/octet-stream",
      fileSize: f.size,
      version: 1,
    });
    migrated++;
  }
  console.log(`migrated: ${migrated}, already-present: ${skipped}, unlinked: ${orphaned}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
