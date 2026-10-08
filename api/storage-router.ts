/**
 * Logo/asset storage — server-only, keys persisted in DB, URLs minted at render time.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { storage } from "./lib/storage";
import { getDb } from "./queries/connection";
import { storedFiles, brandAssets } from "../db/schema";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB cap for brand logos

export const storageRouter = createRouter({
  upload: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(512),
        contentBase64: z.string(),
        contentType: z.string().optional(),
        purpose: z.string().max(64).default("logo"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      if (bytes.byteLength > MAX_UPLOAD_BYTES) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "File exceeds 8 MB." });
      }
      const safeName = `u/${ctx.user.id}/${input.purpose}/${Date.now()}-${input.name.replace(/[^\w.\-一-鿿 ]/g, "_")}`;
      const saved = await storage.uploadFile({
        fileContent: bytes,
        fileName: safeName,
        contentType: input.contentType,
      });
      await getDb()
        .insert(storedFiles)
        .values({
          key: saved.key,
          ownerId: ctx.user.id,
          name: input.name,
          size: saved.size,
          purpose: input.purpose,
        });
      return { key: saved.key, size: saved.size };
    }),

  url: authedQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await getDb().query.storedFiles.findFirst({
        where: eq(storedFiles.key, input.key),
      });
      if (row && row.ownerId === ctx.user.id) {
        const { url } = await storage.getPresignedUrl({ key: input.key });
        return { url };
      }
      // brand-scoped assets uploaded after the Asset Library launch
      const asset = await getDb().query.brandAssets.findFirst({
        where: eq(brandAssets.storageKey, input.key),
      });
      if (!asset || asset.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { url } = await storage.getPresignedUrl({ key: input.key });
      return { url };
    }),

  remove: authedQuery
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await getDb().query.storedFiles.findFirst({
        where: eq(storedFiles.key, input.key),
      });
      if (!row || row.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await getDb().delete(storedFiles).where(eq(storedFiles.key, input.key));
      return { ok: await storage.deleteFile({ fileKey: input.key }) };
    }),
});
