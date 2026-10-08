import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./connection";
import { brands, brandVersions, brandAssets } from "../../db/schema";
import type { Brand, BrandVersion } from "../../db/schema";
import type { BrandData } from "../../contracts/brand";
import { getStorageService } from "../lib/assetStorage";

export async function listBrands(userId: number): Promise<Brand[]> {
  return getDb().query.brands.findMany({
    where: eq(brands.userId, userId),
    orderBy: [desc(brands.updatedAt)],
  });
}

export async function getOwnedBrand(brandId: number, userId: number): Promise<Brand> {
  const brand = await getDb().query.brands.findFirst({ where: eq(brands.id, brandId) });
  if (!brand || brand.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Brand not found." });
  }
  return brand;
}

export async function createBrand(
  userId: number,
  input: { name: string; business: string; data: BrandData },
): Promise<Brand> {
  const db = getDb();
  const [{ id }] = await db
    .insert(brands)
    .values({ userId, name: input.name, business: input.business, data: input.data })
    .$returningId();
  const brand = await db.query.brands.findFirst({ where: eq(brands.id, id) });
  if (!brand) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  await snapshotVersion(brand, "Brand v1.0 — initial system");
  return brand;
}

export async function updateBrandData(
  brandId: number,
  userId: number,
  data: BrandData,
  versionLabel?: string,
): Promise<Brand> {
  const db = getDb();
  const brand = await getOwnedBrand(brandId, userId);
  const nextVersion = brand.currentVersion + 1;
  await db
    .update(brands)
    .set({ data, currentVersion: nextVersion })
    .where(eq(brands.id, brandId));
  const updated = await getOwnedBrand(brandId, userId);
  await snapshotVersion(
    updated,
    versionLabel ?? `Brand v${(nextVersion / 10).toFixed(1)}`,
  );
  return updated;
}

async function snapshotVersion(brand: Brand, label: string): Promise<void> {
  await getDb().insert(brandVersions).values({
    brandId: brand.id,
    version: brand.currentVersion,
    label,
    data: brand.data,
  });
}

export async function listVersions(brandId: number, userId: number): Promise<BrandVersion[]> {
  await getOwnedBrand(brandId, userId);
  return getDb().query.brandVersions.findMany({
    where: eq(brandVersions.brandId, brandId),
    orderBy: [desc(brandVersions.version)],
  });
}

export async function restoreVersion(
  brandId: number,
  userId: number,
  versionId: number,
): Promise<Brand> {
  const db = getDb();
  const brand = await getOwnedBrand(brandId, userId);
  const version = await db.query.brandVersions.findFirst({
    where: eq(brandVersions.id, versionId),
  });
  if (!version || version.brandId !== brandId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Version not found." });
  }
  const nextVersion = brand.currentVersion + 1;
  await db
    .update(brands)
    .set({ data: version.data, currentVersion: nextVersion })
    .where(eq(brands.id, brandId));
  const updated = await getOwnedBrand(brandId, userId);
  await snapshotVersion(updated, `Restored from ${version.label || "v" + version.version}`);
  return updated;
}

export async function renameBrand(
  brandId: number,
  userId: number,
  name: string,
): Promise<void> {
  const db = getDb();
  await getOwnedBrand(brandId, userId);
  await db.update(brands).set({ name }).where(eq(brands.id, brandId));
}

export async function setPortalEnabled(
  brandId: number,
  userId: number,
  enabled: boolean,
): Promise<void> {
  const db = getDb();
  await getOwnedBrand(brandId, userId);
  await db.update(brands).set({ portalEnabled: enabled }).where(eq(brands.id, brandId));
}

export async function deleteBrand(brandId: number, userId: number): Promise<void> {
  const db = getDb();
  const brand = await getOwnedBrand(brandId, userId);
  // §11 — remove the brand's assets from object storage AND metadata rows so
  // no orphaned files are left behind. The legacy logo key recorded in brand
  // data is covered too.
  const assets = await db.query.brandAssets.findMany({
    where: eq(brandAssets.brandId, brandId),
  });
  const legacyKey = brand.data.logo?.assetKey;
  const keys = [...assets.map((a) => a.storageKey), ...(legacyKey ? [legacyKey] : [])];
  if (keys.length > 0) {
    await getStorageService().deleteMany(keys);
  }
  await db.delete(brandAssets).where(eq(brandAssets.brandId, brandId));
  await db.delete(brandVersions).where(eq(brandVersions.brandId, brandId));
  await db.delete(brands).where(eq(brands.id, brandId));
}
