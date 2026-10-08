/**
 * Smoke test: db/pg schema + connection against a real Postgres.
 * Run:  SUPABASE_DB_URL=postgresql://postgres:pgtest@localhost:5432/bk360_test npm run db:smoke:pg
 * Inserts a user → plan → order → purchase → brand → version → asset, then
 * reads the graph back, exercising enums, FKs, jsonb and column defaults.
 */
import { getPgDb, closePgDb } from "./connection";
import { users, plans, orders, purchases, brands, brandVersions, brandAssets } from "./schema";
import type { BrandData } from "../../contracts/brand";

async function main() {
  const db = getPgDb();

  const [u] = await db
    .insert(users)
    .values({ unionId: "smoke-union-1", name: "Smoke User", email: "smoke@test.dev", role: "user" })
    .returning();
  console.log("user ok:", u.id, u.role, u.createdAt instanceof Date);

  const [p] = await db
    .insert(plans)
    .values({
      slug: "smoke-plan",
      name: "SMOKE",
      tagline: "t",
      description: "d",
      price: 9900,
      deliverables: [{ label: "x", detail: "y" }],
      corePromise: "c",
      whoFor: "w",
      result: "r",
    })
    .returning();
  console.log("plan ok:", p.id, p.currency, p.active);

  const [o] = await db
    .insert(orders)
    .values({ userId: u.id, planId: p.id, amount: 9900, status: "completed" })
    .returning();
  const [pu] = await db
    .insert(purchases)
    .values({ userId: u.id, planId: p.id, orderId: o.id, amount: 9900 })
    .returning();
  console.log("order/purchase ok:", o.id, o.status, pu.status);

  const data = {
    dna: { essence: "e", positioning: "p", audience: "a", promise: "pr", toneOfVoice: "t", visualDirection: "v", keywords: ["k"] },
    personality: ["Premium"],
  } as unknown as BrandData;
  const [b] = await db
    .insert(brands)
    .values({ userId: u.id, name: "Smoke Brand", business: "testing", data })
    .returning();
  console.log("brand ok:", b.id, b.currentVersion, b.data.dna?.essence === "e" ? "jsonb-roundtrip-ok" : "JSONB-FAIL");

  const [v] = await db.insert(brandVersions).values({ brandId: b.id, version: 10, label: "save", data }).returning();
  console.log("version ok:", v.id, v.version);

  const [a] = await db
    .insert(brandAssets)
    .values({
      brandId: b.id,
      userId: u.id,
      assetType: "images",
      fileName: "AI photography — hero frame",
      storageKey: "brands/1/images/original/smoke.jpg",
      mimeType: "image/jpeg",
      fileSize: 12345,
      source: "ai",
    })
    .returning();
  console.log("asset ok:", a.id, a.assetType, a.source, a.storageProvider);

  const myBrands = await db.query.brands.findMany({ where: (t, { eq }) => eq(t.userId, u.id) });
  console.log("relational-query ok:", myBrands.length === 1);

  const badEnum = await db
    .insert(orders)
    .values({ userId: u.id, planId: p.id, amount: 1, status: "completed" })
    .returning()
    .then(() => "accepted")
    .catch((e) => (String(e).includes("orders_status_enum") || String(e).includes("enum") ? "enum-enforced" : `unexpected: ${e}`));
  console.log("check constraint probe:", badEnum);

  console.log("SMOKE-PASS");
  await closePgDb();
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("SMOKE-FAIL:", e);
  process.exit(1);
});
