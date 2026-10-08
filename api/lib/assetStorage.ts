/**
 * §5 — Storage abstraction layer.
 *
 * Application code depends only on the `StorageService` interface below.
 * The initial provider is the platform object storage ("tos"); a future
 * Cloudflare R2 / S3-compatible provider implements the same interface and
 * is selected in `getStorageService()` — the Brand data model never changes,
 * because assets persist `storageProvider` + `storageKey`, never URLs.
 *
 *   StorageService
 *     ├── upload()      → { key, fileName, size, contentType, etag }
 *     ├── download()    → bytes
 *     ├── delete()      → boolean
 *     ├── deleteMany()  → boolean
 *     ├── getUrl()      → short-lived facade URL (~10 min; never persisted)
 *     ├── getMetadata() → { size, contentType, etag, lastModified }
 *     └── listKeys()    → keys under a prefix
 */
import { storage } from "./storage";

export interface UploadArgs {
  fileContent: Uint8Array;
  /** logical path, e.g. brands/12/logo/original/logo.svg */
  fileName: string;
  contentType?: string;
}

export interface StoredObject {
  key: string;
  fileName: string;
  size: number;
  contentType?: string;
  etag?: string;
}

export interface ObjectMetadata {
  size: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
}

export interface StorageService {
  readonly provider: string;
  upload(args: UploadArgs): Promise<StoredObject>;
  download(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<boolean>;
  deleteMany(keys: string[]): Promise<boolean>;
  getUrl(key: string, opts?: { download?: boolean; fileName?: string }): Promise<string>;
  getMetadata(key: string): Promise<ObjectMetadata>;
  listKeys(prefix: string): Promise<string[]>;
}

/** Platform object storage (TOS) — current provider. */
class PlatformStorageService implements StorageService {
  readonly provider = "tos";

  async upload(args: UploadArgs): Promise<StoredObject> {
    const r = await storage.uploadFile({
      fileContent: args.fileContent,
      fileName: args.fileName,
      contentType: args.contentType,
    });
    return {
      key: r.key,
      fileName: r.fileName,
      size: r.size,
      contentType: r.contentType,
      etag: r.etag,
    };
  }

  async download(key: string): Promise<Uint8Array> {
    return storage.readFile({ fileKey: key });
  }

  async delete(key: string): Promise<boolean> {
    return storage.deleteFile({ fileKey: key });
  }

  async deleteMany(keys: string[]): Promise<boolean> {
    if (keys.length === 0) return true;
    const r = await storage.deleteFiles({ fileKeys: keys });
    return r.failed.length === 0;
  }

  async getUrl(key: string, opts?: { download?: boolean; fileName?: string }): Promise<string> {
    // note: the facade restores the uploaded file name on download; fileName is
    // recorded in DB metadata, so it is accepted here for interface completeness.
    void opts?.fileName;
    const r = await storage.getPresignedUrl({ key, download: opts?.download ? true : undefined });
    return r.url;
  }

  async getMetadata(key: string): Promise<ObjectMetadata> {
    const m = await storage.headFile({ fileKey: key });
    return {
      size: m.size,
      contentType: m.contentType,
      etag: m.etag,
      lastModified: m.lastModified ? new Date(m.lastModified) : undefined,
    };
  }

  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await storage.listFiles({ prefix, delimiter: "", pageToken: token });
      keys.push(...page.objects.map((o) => o.key));
      token = page.nextPageToken ?? undefined;
    } while (token);
    return keys;
  }
}

/**
 * Provider selection. Add a case here (env-driven) when an R2/S3 service is
 * introduced — nothing upstream changes.
 */
export function getStorageService(): StorageService {
  return new PlatformStorageService();
}

/** Logical object path per spec §6: brands/{brandId}/{type}/{area}/{file} */
export function assetPath(
  brandId: number,
  assetType: string,
  fileName: string,
  area = "original",
): string {
  const safe = fileName.replace(/[^\w.\-一-鿿 ]/g, "_").slice(-180);
  return `brands/${brandId}/${assetType}/${area}/${Date.now()}-${safe}`;
}
