import { asc, eq } from "drizzle-orm";
import { getDb } from "./connection";
import { plans, orders, purchases } from "../../db/schema";
import type { Plan } from "../../db/schema";

export async function listActivePlans(): Promise<Plan[]> {
  return getDb().query.plans.findMany({
    where: eq(plans.active, true),
    orderBy: [asc(plans.sortOrder)],
  });
}

export async function getPlanBySlug(slug: string): Promise<Plan | undefined> {
  return getDb().query.plans.findFirst({ where: eq(plans.slug, slug) });
}

export async function listAllPlans(): Promise<Plan[]> {
  return getDb().query.plans.findMany({ orderBy: [asc(plans.sortOrder)] });
}

export async function updatePlan(
  id: number,
  patch: Partial<Omit<Plan, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await getDb().update(plans).set(patch).where(eq(plans.id, id));
}

export async function listPurchases(userId: number) {
  return getDb().query.purchases.findMany({
    where: eq(purchases.userId, userId),
    orderBy: [asc(purchases.createdAt)],
  });
}

export { orders, purchases };
