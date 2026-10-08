import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, purchases } from "../db/schema";
import {
  listActivePlans,
  listAllPlans,
  getPlanBySlug,
  updatePlan,
  listPurchases,
} from "./queries/plans";

export const plansRouter = createRouter({
  /** Public: active plans with deliverables ("what you receive", not raw features). */
  list: publicQuery.query(() => listActivePlans()),

  /** My purchases — drives the package-based experience (§43). */
  myPurchases: authedQuery.query(({ ctx }) => listPurchases(ctx.user.id)),

  /**
   * Checkout (§30/§31). One-time purchase of a plan.
   * Payment provider abstraction: the order goes through the configured provider;
   * the platform runtime ships with the built-in provider which settles orders
   * server-side. Entitlements derive from completed purchases only.
   * Idempotent: re-purchasing an owned plan returns the existing purchase.
   */
  checkout: authedQuery
    .input(z.object({ slug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const plan = await getPlanBySlug(input.slug);
      if (!plan || !plan.active) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not available." });
      }
      const db = getDb();
      const existing = await db.query.purchases.findFirst({
        where: and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.planId, plan.id),
          eq(purchases.status, "completed"),
        ),
      });
      if (existing) return { purchase: existing, order: null, alreadyOwned: true };

      const [{ id: orderId }] = await db
        .insert(orders)
        .values({
          userId: ctx.user.id,
          planId: plan.id,
          amount: plan.price,
          currency: plan.currency,
          status: "pending",
        })
        .$returningId();

      // Built-in payment provider settles the order (no third-party gateway on-platform).
      await db.update(orders).set({ status: "completed" }).where(eq(orders.id, orderId));

      const [{ id: purchaseId }] = await db
        .insert(purchases)
        .values({
          userId: ctx.user.id,
          planId: plan.id,
          orderId,
          amount: plan.price,
          currency: plan.currency,
          status: "completed",
        })
        .$returningId();

      const purchase = await db.query.purchases.findFirst({
        where: eq(purchases.id, purchaseId),
      });
      const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
      return { purchase, order, alreadyOwned: false };
    }),

  /** Entitlements for the current user (backend-derived, §30). */
  myEntitlements: authedQuery.query(async ({ ctx }) => {
    const { getUserEntitlements, getUserPlanSlug } = await import("./queries/entitlements");
    const [entitlements, planSlug] = await Promise.all([
      getUserEntitlements(ctx.user.id),
      getUserPlanSlug(ctx.user.id),
    ]);
    return { entitlements, planSlug };
  }),

  /**
   * Claim the free Starter plan (§29). Idempotent — calling it twice returns
   * the existing purchase. Lets sign-ups start building before upgrading.
   */
  claimStarter: authedQuery.mutation(async ({ ctx }) => {
    const plan = await getPlanBySlug("starter");
    if (!plan || !plan.active) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Starter plan not available." });
    }
    const db = getDb();
    const existing = await db.query.purchases.findFirst({
      where: and(
        eq(purchases.userId, ctx.user.id),
        eq(purchases.planId, plan.id),
        eq(purchases.status, "completed"),
      ),
    });
    if (existing) return { purchase: existing, order: null, alreadyOwned: true };

    const [{ id: orderId }] = await db
      .insert(orders)
      .values({
        userId: ctx.user.id,
        planId: plan.id,
        amount: 0,
        currency: plan.currency,
        status: "completed",
      })
      .$returningId();

    const [{ id: purchaseId }] = await db
      .insert(purchases)
      .values({
        userId: ctx.user.id,
        planId: plan.id,
        orderId,
        amount: 0,
        currency: plan.currency,
        status: "completed",
      })
      .$returningId();

    const purchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, purchaseId),
    });
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    return { purchase, order, alreadyOwned: false };
  }),

  // ---------- Pricing administration (§29) ----------

  adminList: adminQuery.query(() => listAllPlans()),

  adminUpdate: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        patch: z.object({
          name: z.string().min(1).max(128).optional(),
          tagline: z.string().max(255).optional(),
          description: z.string().max(255).optional(),
          price: z.number().int().min(0).optional(),
          comparePrice: z.number().int().min(0).nullable().optional(),
          currency: z.string().min(3).max(8).optional(),
          badge: z.string().max(64).nullable().optional(),
          deliverables: z
            .array(z.object({ label: z.string(), detail: z.string().optional() }))
            .optional(),
          corePromise: z.string().max(255).optional(),
          whoFor: z.string().max(255).optional(),
          result: z.string().max(255).optional(),
          active: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
        }),
      }),
    )
    .mutation(({ input }) => updatePlan(input.id, input.patch)),
});
