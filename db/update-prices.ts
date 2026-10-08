/**
 * One-off pricing update (§29): sets the three plan tiers to the new USD
 * base prices — Guidelines $99, System $249, System Pro $499.
 * Run: npx tsx -r dotenv/config db/update-prices.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { plans } from "./schema";

const UPDATES = [
  { slug: "guidelines", price: 9900, currency: "USD" },
  { slug: "system", price: 24900, currency: "USD" },
  { slug: "system_pro", price: 49900, currency: "USD" },
];

async function run() {
  const db = getDb();
  for (const u of UPDATES) {
    await db.update(plans).set({ price: u.price, currency: u.currency }).where(eq(plans.slug, u.slug));
    console.log(`updated ${u.slug} → ${u.currency} ${(u.price / 100).toFixed(0)}`);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
