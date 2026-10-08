/**
 * §7 — Brand Asset Library.
 *
 * Every procedure enforces ownership server-side: a user can only touch assets
 * of a brand they own (spec §8 — never rely on frontend checks; ID manipulation
 * hits these checks). Files live in object storage; this DB holds metadata.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { getStorageService, assetPath } from "./lib/assetStorage";
import { ASSET_TYPES, brandAssets, brands, plans } from "../db/schema";
import { getUserPlanSlug } from "./queries/entitlements";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // platform hard cap (§100MB)

/** Configurable per-plan storage entitlements in MB (§10 — admin-overridable via plans.storageLimitMb). */
export const DEFAULT_STORAGE_LIMIT_MB: Record<string, number> = {
  guidelines: 1024,
  system: 4096,
  system_pro: 10240,
};

export async function ownedBrand(brandId: number, userId: number) {
  const brand = await getDb().query.brands.findFirst({ where: eq(brands.id, brandId) });
  if (!brand || brand.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this brand." });
  }
  return brand;
}

export async function storageEntitlement(userId: number) {
  const db = getDb();
  const slug = await getUserPlanSlug(userId);
  if (!slug) return { limitMb: DEFAULT_STORAGE_LIMIT_MB.guidelines, planSlug: null as string | null };
  const plan = await db.query.plans.findFirst({ where: eq(plans.slug, slug) });
  return {
    limitMb: plan?.storageLimitMb ?? DEFAULT_STORAGE_LIMIT_MB[slug] ?? 1024,
    planSlug: slug,
  };
}

export const assetsRouter = createRouter({
  /** §7 — list a brand's assets with category filter + filename search. */
  list: authedQuery
    .input(
      z.object({
        brandId: z.number().int(),
        assetType: z.enum(ASSET_TYPES).optional(),
        search: z.string().max(200).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ownedBrand(input.brandId, ctx.user.id);
      const db = getDb();
      const conditions = [eq(brandAssets.brandId, input.brandId)];
      if (input.assetType) conditions.push(eq(brandAssets.assetType, input.assetType));
      if (input.search?.trim()) conditions.push(like(brandAssets.fileName, `%${input.search.trim()}%`));
      return db
        .select()
        .from(brandAssets)
        .where(and(...conditions))
        .orderBy(desc(brandAssets.updatedAt));
    }),

  /** §7/§10 — storage usage vs the plan's configurable entitlement. */
  usage: authedQuery
    .input(z.object({ brandId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await ownedBrand(input.brandId, ctx.user.id);
      const db = getDb();
      const row = await db
        .select({ total: sql<number>`COALESCE(SUM(${brandAssets.fileSize}), 0)` })
        .from(brandAssets)
        .where(eq(brandAssets.brandId, input.brandId));
      const ent = await storageEntitlement(ctx.user.id);
      return {
        usedBytes: Number(row[0]?.total ?? 0),
        limitMb: ent.limitMb,
        planSlug: ent.planSlug,
      };
    }),

  /** §6 — upload a file for a brand; storage entitlement is enforced server-side. */
  upload: authedQuery
    .input(
      z.object({
        brandId: z.number().int(),
        assetType: z.enum(ASSET_TYPES),
        name: z.string().min(1).max(512),
        contentBase64: z.string(),
        contentType: z.string().max(128).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ownedBrand(input.brandId, ctx.user.id);
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      if (bytes.byteLength > MAX_UPLOAD_BYTES) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "File exceeds the 100 MB limit." });
      }

      const db = getDb();
      const ent = await storageEntitlement(ctx.user.id);
      const usage = await db
        .select({ total: sql<number>`COALESCE(SUM(${brandAssets.fileSize}), 0)` })
        .from(brandAssets)
        .where(eq(brandAssets.userId, ctx.user.id));
      const used = Number(usage[0]?.total ?? 0);
      if (used + bytes.byteLength > ent.limitMb * 1024 * 1024) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Storage limit reached for your plan (${ent.limitMb} MB). Delete old assets or upgrade.`,
        });
      }

      const svc = getStorageService();
      const saved = await svc.upload({
        fileContent: bytes,
        fileName: assetPath(input.brandId, input.assetType, input.name),
        contentType: input.contentType,
      });
      await db.insert(brandAssets).values({
        brandId: input.brandId,
        userId: ctx.user.id,
        assetType: input.assetType,
        fileName: input.name,
        storageProvider: svc.provider,
        storageKey: saved.key,
        mimeType: input.contentType ?? saved.contentType ?? "application/octet-stream",
        fileSize: saved.size,
      });
      return { id: Number((await db.select({ id: brandAssets.id }).from(brandAssets).where(eq(brandAssets.storageKey, saved.key)))[0]?.id), key: saved.key, size: saved.size };
    }),

  /** Preview URL (short-lived, minted at render — never persisted). */
  url: authedQuery
    .input(z.object({ id: z.number().int(), download: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const row = await getDb().query.brandAssets.findFirst({ where: eq(brandAssets.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const url = await getStorageService().getUrl(row.storageKey, {
        download: input.download,
        fileName: row.fileName,
      });
      return { url };
    }),

  /** §7 — file information: DB metadata + live object metadata. */
  info: authedQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const row = await getDb().query.brandAssets.findFirst({ where: eq(brandAssets.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const meta = await getStorageService().getMetadata(row.storageKey);
      return { ...row, meta };
    }),

  /** §7/§11 — owner-checked delete: metadata row and object storage file both go. */
  remove: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.query.brandAssets.findFirst({ where: eq(brandAssets.id, input.id) });
      if (!row || row.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(brandAssets).where(eq(brandAssets.id, input.id));
      return { ok: await getStorageService().delete(row.storageKey) };
    }),
});
