/**
 * Entitlement architecture (§30): access is derived from purchases and enforced
 * on the backend — never through frontend-only hiding.
 */
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./connection";
import { purchases, plans } from "../../db/schema";
import {
  ENTITLEMENTS,
  PLAN_ENTITLEMENTS,
  type Entitlement,
} from "../../contracts/brand";

/** Highest plan tier the user owns: none < starter < guidelines < system < system_pro */
const TIER_RANK: Record<string, number> = {
  starter: 0.5,
  guidelines: 1,
  system: 2,
  system_pro: 3,
};

export async function getUserPlanSlug(userId: number): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ slug: plans.slug, status: purchases.status })
    .from(purchases)
    .innerJoin(plans, eq(purchases.planId, plans.id))
    .where(eq(purchases.userId, userId));
  let best: string | null = null;
  let bestRank = 0;
  for (const row of rows) {
    if (row.status !== "completed") continue;
    if ((TIER_RANK[row.slug] ?? 0) > bestRank) {
      bestRank = TIER_RANK[row.slug];
      best = row.slug;
    }
  }
  return best;
}

export async function getUserEntitlements(userId: number): Promise<Entitlement[]> {
  const slug = await getUserPlanSlug(userId);
  if (!slug) return [];
  return PLAN_ENTITLEMENTS[slug] ?? [];
}

export async function requireEntitlement(userId: number, key: Entitlement) {
  const entitlements = await getUserEntitlements(userId);
  if (!entitlements.includes(key)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This capability requires the "${key}" entitlement. Upgrade your BrandKit360 plan.`,
    });
  }
  return entitlements;
}

export function allEntitlements(): Entitlement[] {
  return [...ENTITLEMENTS];
}
