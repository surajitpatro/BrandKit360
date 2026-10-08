import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brands as brandsTable } from "../db/schema";
import {
  listBrands,
  getOwnedBrand,
  createBrand,
  updateBrandData,
  listVersions,
  restoreVersion,
  renameBrand,
  setPortalEnabled,
  deleteBrand,
} from "./queries/brands";
import { requireEntitlement } from "./queries/entitlements";
import { getUserPlanSlug } from "./queries/entitlements";
import type { BrandData } from "../contracts/brand";

const brandDataSchema = z.custom<BrandData>((v) => typeof v === "object" && v !== null);

export const brandsRouter = createRouter({
  list: authedQuery.query(({ ctx }) => listBrands(ctx.user.id)),

  /** Public Brand Portal (§20) — only published portals are readable. */
  portal: publicQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const brand = await getDb().query.brands.findFirst({ where: eq(brandsTable.id, input.id) });
      if (!brand || !brand.portalEnabled) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This brand portal is not published." });
      }
      return brand;
    }),

  get: authedQuery
    .input(z.object({ id: z.number().int() }))
    .query(({ ctx, input }) => getOwnedBrand(input.id, ctx.user.id)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        business: z.string().max(255),
        data: brandDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Starter tier (rank < 1) is limited to 1 brand system.
      const planSlug = await getUserPlanSlug(ctx.user.id);
      const PAID_TIERS = ["guidelines", "system", "system_pro"];
      if (!planSlug || !PAID_TIERS.includes(planSlug)) {
        const existing = await listBrands(ctx.user.id);
        if (existing.length >= 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Your Starter plan includes 1 brand system. Upgrade to create more brands.",
          });
        }
      }
      return createBrand(ctx.user.id, input);
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number().int(),
        data: brandDataSchema,
        versionLabel: z.string().max(128).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      updateBrandData(input.id, ctx.user.id, input.data, input.versionLabel),
    ),

  versions: authedQuery
    .input(z.object({ id: z.number().int() }))
    .query(({ ctx, input }) => listVersions(input.id, ctx.user.id)),

  restore: authedQuery
    .input(z.object({ id: z.number().int(), versionId: z.number().int() }))
    .mutation(({ ctx, input }) => restoreVersion(input.id, ctx.user.id, input.versionId)),

  rename: authedQuery
    .input(z.object({ id: z.number().int(), name: z.string().min(1).max(255) }))
    .mutation(({ ctx, input }) => renameBrand(input.id, ctx.user.id, input.name)),

  setPortal: authedQuery
    .input(z.object({ id: z.number().int(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireEntitlement(ctx.user.id, "brand_portal");
      await setPortalEnabled(input.id, ctx.user.id, input.enabled);
      return { ok: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(({ ctx, input }) => deleteBrand(input.id, ctx.user.id)),
});
