/**
 * One-off additive migration: brand_assets.source column.
 * Idempotent — checks information_schema before altering. Never truncates.
 */
import "dotenv/config";
import { getDb } from "../api/queries/connection";

async function main() {
  const db = getDb();
  const rows = await db.execute(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brand_assets' AND COLUMN_NAME = 'source'`,
  );
  const n = Number((rows as unknown as { n: number }[])[0]?.n ?? 0);
  if (n > 0) {
    console.log("brand_assets.source already exists — skipped");
    return;
  }
  await db.execute(
    `ALTER TABLE brand_assets ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'upload' AFTER fileSize`,
  );
  console.log("brand_assets.source added");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
