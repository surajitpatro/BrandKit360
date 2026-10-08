/**
 * Storage E2E verification (website-storage skill): upload a tiny object via
 * the StorageService abstraction, confirm with two independent reads
 * (headFile + listFiles), open the presigned URL, then delete and confirm
 * the object is gone. Run: npx tsx -r dotenv/config db/storage-check.ts
 */
import "dotenv/config";
import { getStorageService } from "../api/lib/assetStorage";

// 64x64 test image (content audit rejects tiny resolutions)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAZElEQVR4nO3PQQ3AIADAQOCJFKTgX9BE8Lgs6Slo5z53/NnSAa8a0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0BrQGtAa0D4AoAD+fdz7fAAAAABJRU5ErkJggg==",
  "base64",
);

async function run() {
  const svc = getStorageService();
  const path = `brands/0/images/original/selftest-${Date.now()}.png`;

  const up = await svc.upload({ fileContent: PNG, fileName: path, contentType: "image/png" });
  console.log("upload ok:", up.key, up.size, "bytes");

  const meta = await svc.getMetadata(up.key);
  console.log("headFile ok:", meta.size, meta.contentType);

  const keys = await svc.listKeys("brands/0/images/original/");
  console.log("listFiles ok:", keys.includes(up.key), `(${keys.length} under prefix)`);

  const url = await svc.getUrl(up.key);
  const res = await fetch(url, { redirect: "follow" });
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("presigned url ok:", res.status, buf.equals(PNG) ? "content matches" : "CONTENT MISMATCH");

  const dl = await svc.getUrl(up.key, { download: true, fileName: "selftest.png" });
  const res2 = await fetch(dl, { redirect: "follow" });
  console.log("download url ok:", res2.status);

  const del = await svc.delete(up.key);
  const exists = await svc.getMetadata(up.key).then(() => true).catch(() => false);
  console.log("delete ok:", del, "· still exists:", exists);

  process.exit(0);
}

run().catch((err) => {
  console.error("STORAGE CHECK FAILED:", err);
  process.exit(1);
});
