/**
 * Seed configurable plan data (§29 — pricing administration: never hardcode prices).
 * Run: npx tsx -r dotenv/config db/seed.ts
 * Idempotent: upserts plans by slug, preserving admin edits to price/promo fields.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { plans } from "./schema";
import { DEFAULT_PLANS } from "../contracts/brand";

async function seed() {
  const db = getDb();
  for (const plan of DEFAULT_PLANS) {
    const existing = await db.query.plans.findFirst({ where: eq(plans.slug, plan.slug) });
    if (existing) {
      // Keep existing admin-configured pricing; refresh only descriptive copy.
      await db
        .update(plans)
        .set({
          name: plan.name,
          tagline: plan.tagline,
          description: plan.description,
          badge: plan.badge,
          deliverables: plan.deliverables,
          corePromise: plan.corePromise,
          whoFor: plan.whoFor,
          result: plan.result,
          sortOrder: plan.sortOrder,
        })
        .where(eq(plans.id, existing.id));
      console.log(`updated plan ${plan.slug} (price left as configured: ${existing.price})`);
    } else {
      await db.insert(plans).values(plan);
      console.log(`created plan ${plan.slug}`);
    }
  }
  console.log("seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
