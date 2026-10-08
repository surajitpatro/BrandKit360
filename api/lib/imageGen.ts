/**
 * imageGen.ts — server-side AI image generation through the platform gateway.
 *
 * Same credential pattern as api/lib/storage.ts: the platform injects
 * KIMI_AGENTGW_API_KEY + KIMI_AGENTGW_BASE_URL into the project .env
 * (server-only — never expose to the browser). Calls the gateway's
 * `generate_image` tool and returns the image bytes; callers persist them
 * through the site's own object storage so assets live under the owner's
 * storage quota with DB-tracked keys — never as third-party URLs.
 *
 * Generation is billed to the site owner's quota; callers must gate the
 * action behind an explicit user action and surface failures honestly.
 */

export interface GeneratedImage {
  bytes: Uint8Array;
  contentType: string;
}

/** The gateway can hold the request for up to ~450 s on slow generations. */
const GATEWAY_TIMEOUT_MS = 450_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

interface NodeLikeProcess {
  env?: Record<string, string | undefined>;
  loadEnvFile?: (path?: string) => void;
}

let envFileLoaded = false;

function loadEnvFileOnce(): void {
  if (envFileLoaded) return;
  envFileLoaded = true;
  const proc = (globalThis as { process?: NodeLikeProcess }).process;
  if (typeof proc?.loadEnvFile !== "function") return;
  try {
    proc.loadEnvFile();
  } catch {
    // no .env / unsupported runtime — readEnv returns undefined, caller errors
  }
}

function readEnv(key: string): string | undefined {
  const proc = (globalThis as { process?: NodeLikeProcess }).process;
  const value = proc?.env?.[key];
  if (value !== undefined && value !== "") return value;
  loadEnvFileOnce();
  return proc?.env?.[key];
}

function gatewayBase(): string {
  const raw = (readEnv("KIMI_AGENTGW_BASE_URL") ?? "").trim();
  return raw.replace(/\/(v1\/tools|v1)$/, "").replace(/\/+$/, "");
}

/**
 * Generate one image. `size` is "WIDTHxHEIGHT" — both multiples of 16,
 * aspect ≤ 3:1, total pixels 655,360–8,294,400 (gateway v2 contract).
 */
export async function generateImage(
  description: string,
  size = "1536x1024",
  referenceUrls?: string[],
): Promise<GeneratedImage> {
  const apiKey = readEnv("KIMI_AGENTGW_API_KEY");
  const base = gatewayBase();
  if (!apiKey || !base) {
    throw new Error("IMAGEGEN_NOT_PROVISIONED");
  }

  const params: Record<string, unknown> = {
    description,
    size,
    background: "IMAGE_BACKGROUND_OPAQUE",
    version: "v2",
  };
  if (referenceUrls?.length) params.reference_image_urls = referenceUrls;

  const resp = await fetch(`${base}/v1/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ method: "generate_image", params }),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
  });
  if (!resp.ok) {
    throw new Error(`IMAGEGEN_UPSTREAM_${resp.status}`);
  }

  // Media tools return raw proto JSON ({"media": {...}}); some deployments
  // wrap it in the standard result.user[0].text envelope — accept both.
  const raw: unknown = await resp.json();
  const envelope = raw as { result?: { user?: { text?: string }[] } };
  const inner = envelope?.result?.user?.[0]?.text;
  const data = inner ? (JSON.parse(inner) as Record<string, unknown>) : (raw as Record<string, unknown>);
  const media = data?.media as { url?: string; mime_type?: string } | undefined;
  if (!media?.url) {
    throw new Error("IMAGEGEN_NO_MEDIA");
  }

  const img = await fetch(media.url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!img.ok) {
    throw new Error(`IMAGEGEN_DOWNLOAD_${img.status}`);
  }
  const bytes = new Uint8Array(await img.arrayBuffer());
  const contentType = media.mime_type || img.headers.get("content-type") || "image/jpeg";
  return { bytes, contentType };
}
