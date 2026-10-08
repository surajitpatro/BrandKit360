/**
 * §6/§7 — AI reference imagery, generated in-product from the brand's own
 * tokens and stored as brand-scoped assets ("images" / source "ai").
 *
 * Honesty rules (product philosophy):
 *  - prompts are built deterministically from the structured system
 *    (photography direction + palette) — never generic mood stock;
 *  - the UI labels every image "AI-generated reference imagery — not a
 *    photograph of a real product";
 *  - generation is billed to the owner's quota, so it is an explicit user
 *    action gated behind the brand_guidelines entitlement.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { brandAssets } from "../db/schema";
import { getStorageService, assetPath } from "./lib/assetStorage";
import { generateImage } from "./lib/imageGen";
import { ownedBrand, storageEntitlement } from "./assets-router";
import { requireEntitlement, getUserEntitlements } from "./queries/entitlements";
import type { BrandData } from "../contracts/brand";

/** Compose an image prompt from the structured photography direction + palette. */
export function buildPhotographyPrompt(data: BrandData, brandName: string): string {
  const p = data.photography;
  const palette = data.colors.list.map((c) => c.hex.toUpperCase()).join(", ");
  const parts = [
    `Editorial brand-campaign photograph for "${brandName}"`,
    `Subject: ${p.subject}`,
    `Lighting: ${p.lighting}`,
    `Composition: ${p.composition}`,
    `Colour treatment: ${p.colour} — grade strictly within the brand palette (${palette})`,
    `People: ${p.people}`,
    `Strictly avoid: ${p.avoid}`,
    "High-end commercial photography, no text, no watermark, no logo overlays",
  ];
  return parts.join(". ");
}

/* ------------------------------------------------------------------ */
/* Launch set — automatic imagery for every new brand (no user action) */
/* ------------------------------------------------------------------ */

const paletteOf = (data: BrandData) => data.colors.list.map((c) => c.hex.toUpperCase()).join(", ");

interface LaunchItem {
  fileName: string;
  prompt: string;
  /** mockups carry the real logo as a reference image; photography never does */
  withLogoRef?: boolean;
}

/** The three photography frames every brand gets: hero, in-context, detail. */
function buildLaunchPhotoPrompts(data: BrandData, brandName: string): LaunchItem[] {
  const p = data.photography;
  const tail = `Colour treatment: ${p.colour} — grade strictly within the brand palette (${paletteOf(data)}). Strictly avoid: ${p.avoid}. High-end commercial photography, no text, no watermark, no logo overlays.`;
  return [
    {
      fileName: "AI photography — hero frame",
      prompt: `Wide editorial hero photograph for "${brandName}". Subject: ${p.subject}. Lighting: ${p.lighting}. Composition: ${p.composition}. People: ${p.people}. ${tail}`,
    },
    {
      fileName: "AI photography — in-context frame",
      prompt: `Candid in-context brand photograph for "${brandName}". People: ${p.people}. Subject and environment: ${p.subject}. Lighting: ${p.lighting}. ${tail}`,
    },
    {
      fileName: "AI photography — detail frame",
      prompt: `Close-up detail photograph for "${brandName}" — materials, texture and craft details drawn from: ${p.subject}. Lighting: ${p.lighting}. ${tail}`,
    },
  ];
}

const MOCKUP_SCENES = [
  { match: /packaging/i, label: "packaging", scene: "product packaging — a box and a label standing on a clean surface with soft shadows" },
  { match: /website|homepage|web\b/i, label: "website hero", scene: "a website homepage hero section displayed on a laptop screen, elegant and minimal" },
  { match: /mobile app/i, label: "mobile app", scene: "a mobile app interface on a phone held in one hand against a soft studio background" },
  { match: /stationery|print|brochure|collateral/i, label: "stationery", scene: "business stationery — letterhead, envelope and business cards arranged in a considered flat lay" },
  { match: /signage/i, label: "signage", scene: "exterior storefront signage mounted on a building facade at dusk" },
  { match: /social/i, label: "social post", scene: "a social media post on a phone screen lying beside a matching printed card" },
  { match: /presentation/i, label: "presentation", scene: "a presentation title slide projected in a dark meeting room" },
  { match: /events?/i, label: "event backdrop", scene: "a branded event backdrop wall at a professional gathering" },
];

/** Two collateral mockups chosen from the brand's own application contexts. */
function buildLaunchMockups(data: BrandData, brandName: string): { fileName: string; prompt: string; withLogoRef: boolean }[] {
  const palette = paletteOf(data);
  const haystack = (data.applications ?? []).join(" · ");
  const picked = MOCKUP_SCENES.filter((s) => s.match.test(haystack)).slice(0, 2);
  while (picked.length < 2) {
    const fallback = MOCKUP_SCENES.find((s) => !picked.includes(s))!;
    picked.push(fallback);
  }
  return picked.map((s) => ({
    fileName: `AI mockup — ${s.label}`,
    withLogoRef: true,
    prompt: `Photorealistic branded collateral mockup for "${brandName}". Scene: ${s.scene}. Feature the provided logo exactly as given, placed naturally and legibly — do not redraw or restyle it. Strict brand palette: ${palette}. No extra text beyond the brand name, no watermarks. Premium commercial product photography, soft studio lighting.`,
  }));
}

const LAUNCH_TOTAL = 5;
const LAUNCH_ESTIMATE_BYTES = 5 * 2 * 1024 * 1024; // ~2 MB per image safety margin
const PER_ITEM_BYTES = 2 * 1024 * 1024;
/** brandIds currently generating (single-process server; DB check keeps it idempotent across restarts). */
const launchInFlight = new Set<number>();

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

/**
 * Background worker: generates the brand's launch imagery set sequentially.
 * Resumable — each item is skipped if an asset with its exact fileName already
 * exists, so a mid-set failure can simply be re-triggered. Per-item failures
 * are logged and skipped; quota is re-checked before every item.
 */
async function runLaunchSet(brandId: number, userId: number, brandName: string, data: BrandData): Promise<void> {
  launchInFlight.add(brandId);
  try {
    const db = getDb();

    // real logo as reference (raster only — SVG can't be fed to the gateway)
    let logoRefUrl: string | undefined;
    const logoRow = await db.query.brandAssets.findFirst({
      where: and(eq(brandAssets.brandId, brandId), eq(brandAssets.assetType, "logo")),
      orderBy: desc(brandAssets.createdAt),
    });
    if (logoRow && /image\/(png|jpe?g)/i.test(logoRow.mimeType ?? "")) {
      try {
        logoRefUrl = await getStorageService().getUrl(logoRow.storageKey);
      } catch {
        logoRefUrl = undefined; // facade URL hiccup — mockups generate textually
      }
    }

    const items = [...buildLaunchPhotoPrompts(data, brandName), ...buildLaunchMockups(data, brandName)];

    for (const item of items) {
      const exists = await db.query.brandAssets.findFirst({
        where: and(
          eq(brandAssets.brandId, brandId),
          eq(brandAssets.source, "ai"),
          eq(brandAssets.fileName, item.fileName),
        ),
      });
      if (exists) continue;

      const ent = await storageEntitlement(userId);
      const usage = await db
        .select({ total: sql<number>`COALESCE(SUM(${brandAssets.fileSize}), 0)` })
        .from(brandAssets)
        .where(eq(brandAssets.userId, userId));
      if (Number(usage[0]?.total ?? 0) + PER_ITEM_BYTES > ent.limitMb * 1024 * 1024) {
        console.warn(`[imagery] launch set paused for brand ${brandId}: storage quota`);
        break;
      }

      try {
        const useRef = item.withLogoRef && !!logoRefUrl;
        const gen = await generateImage(item.prompt, "1536x1024", useRef ? [logoRefUrl!] : undefined).catch(async (e) => {
          // reference fetch can fail on short-lived facade URLs — retry once without it
          if (useRef) return generateImage(item.prompt, "1536x1024");
          throw e;
        });
        const svc = getStorageService();
        const saved = await svc.upload({
          fileContent: gen.bytes,
          fileName: assetPath(brandId, "images", `ai-${slug(item.fileName)}-${Date.now()}.jpg`),
          contentType: gen.contentType,
        });
        await db.insert(brandAssets).values({
          brandId,
          userId,
          assetType: "images",
          fileName: item.fileName,
          source: "ai",
          storageProvider: svc.provider,
          storageKey: saved.key,
          mimeType: gen.contentType,
          fileSize: saved.size,
        });
      } catch (e) {
        console.error(`[imagery] launch item failed for brand ${brandId} (${item.fileName}):`, e);
      }
    }
  } catch (e) {
    console.error(`[imagery] launch set failed for brand ${brandId}:`, e);
  } finally {
    launchInFlight.delete(brandId);
  }
}

export const imageryRouter = createRouter({
  /** AI-generated reference imagery for a brand (source "ai"). */
  list: authedQuery
    .input(z.object({ brandId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await ownedBrand(input.brandId, ctx.user.id);
      return getDb()
        .select()
        .from(brandAssets)
        .where(and(eq(brandAssets.brandId, input.brandId), eq(brandAssets.source, "ai")))
        .orderBy(desc(brandAssets.createdAt));
    }),

  /**
   * Generate one photography-direction reference image for the brand.
   * Storage entitlement is checked BEFORE generation so a full quota never
   * wastes a generation call.
   */
  generate: authedQuery
    .input(z.object({ brandId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const brand = await ownedBrand(input.brandId, ctx.user.id);
      await requireEntitlement(ctx.user.id, "brand_guidelines");

      const db = getDb();
      const ent = await storageEntitlement(ctx.user.id);
      const usage = await db
        .select({ total: sql<number>`COALESCE(SUM(${brandAssets.fileSize}), 0)` })
        .from(brandAssets)
        .where(eq(brandAssets.userId, ctx.user.id));
      const used = Number(usage[0]?.total ?? 0);
      // images land around 1–3 MB; refuse early if even 8 MB wouldn't fit
      if (used + 8 * 1024 * 1024 > ent.limitMb * 1024 * 1024) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Storage limit reached for your plan (${ent.limitMb} MB). Delete old assets or upgrade.`,
        });
      }

      const data = brand.data as BrandData;
      const prompt = buildPhotographyPrompt(data, brand.name);
      let gen;
      try {
        gen = await generateImage(prompt);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "generation failed";
        if (msg.includes("UPSTREAM_429") || msg.toLowerCase().includes("rate")) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Image generation is busy right now — please try again in a minute.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Image generation failed (${msg}). Please retry.`,
        });
      }

      const svc = getStorageService();
      const fileName = `ai-photography-${Date.now()}.jpg`;
      const saved = await svc.upload({
        fileContent: gen.bytes,
        fileName: assetPath(input.brandId, "images", fileName),
        contentType: gen.contentType,
      });
      await db.insert(brandAssets).values({
        brandId: input.brandId,
        userId: ctx.user.id,
        assetType: "images",
        fileName: "AI reference — photography direction",
        source: "ai",
        storageProvider: svc.provider,
        storageKey: saved.key,
        mimeType: gen.contentType,
        fileSize: saved.size,
      });
      const row = await db.query.brandAssets.findFirst({
        where: eq(brandAssets.storageKey, saved.key),
      });
      return { id: row ? Number(row.id) : null, size: saved.size };
    }),

  /**
   * Launch set — fires automatically after brand creation (and lazily from the
   * Studio for older brands). Generates the brand's full imagery package in the
   * background: 3 photography frames + 2 collateral mockups with the real logo.
   * Entitlement and storage quota gate it silently — automatic flow never
   * throws at the user. Idempotent and resumable (per-item fileName check).
   */
  generateLaunchSet: authedQuery
    .input(z.object({ brandId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const brand = await ownedBrand(input.brandId, ctx.user.id);
      const entitlements = await getUserEntitlements(ctx.user.id);
      if (!entitlements.includes("brand_guidelines")) {
        return { started: false as const, reason: "entitlement" };
      }
      if (launchInFlight.has(input.brandId)) {
        return { started: false as const, reason: "in-flight" };
      }
      const db = getDb();
      const ent = await storageEntitlement(ctx.user.id);
      const usage = await db
        .select({ total: sql<number>`COALESCE(SUM(${brandAssets.fileSize}), 0)` })
        .from(brandAssets)
        .where(eq(brandAssets.userId, ctx.user.id));
      if (Number(usage[0]?.total ?? 0) + LAUNCH_ESTIMATE_BYTES > ent.limitMb * 1024 * 1024) {
        return { started: false as const, reason: "quota" };
      }
      // everything missing? nothing to do
      const data = brand.data as BrandData;
      const items = [...buildLaunchPhotoPrompts(data, brand.name), ...buildLaunchMockups(data, brand.name)];
      const existing = await db
        .select({ fileName: brandAssets.fileName })
        .from(brandAssets)
        .where(and(eq(brandAssets.brandId, input.brandId), eq(brandAssets.source, "ai")));
      const have = new Set(existing.map((r) => r.fileName));
      const missing = items.filter((i) => !have.has(i.fileName)).length;
      if (missing === 0) return { started: false as const, reason: "complete" };

      // respond immediately; generation continues server-side (can take minutes)
      void runLaunchSet(input.brandId, ctx.user.id, brand.name, data);
      return { started: true as const, remaining: missing, total: LAUNCH_TOTAL };
    }),

  /** Live progress for the launch set — polled by the Studio while generating. */
  launchStatus: authedQuery
    .input(z.object({ brandId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await ownedBrand(input.brandId, ctx.user.id);
      const rows = await getDb()
        .select({ fileName: brandAssets.fileName })
        .from(brandAssets)
        .where(and(eq(brandAssets.brandId, input.brandId), eq(brandAssets.source, "ai")));
      const launchNames = new Set([
        "AI photography — hero frame", "AI photography — in-context frame", "AI photography — detail frame",
        "AI mockup — packaging", "AI mockup — website hero", "AI mockup — mobile app",
        "AI mockup — stationery", "AI mockup — signage", "AI mockup — social post",
        "AI mockup — presentation", "AI mockup — event backdrop",
      ]);
      const generated = rows.filter((r) => launchNames.has(r.fileName)).length;
      return { inFlight: launchInFlight.has(input.brandId), generated, total: LAUNCH_TOTAL };
    }),
});
