import { useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { AssetType } from "@db/schema";

/**
 * §7 — persistent Asset Library per brand. Files live in object storage;
 * this panel reads metadata through the assets router (server-side ownership
 * enforced). Categories, search, preview, download, info and delete.
 */

const CATEGORIES: { key: "all" | AssetType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "logo", label: "Logos" },
  { key: "guidelines", label: "Guidelines" },
  { key: "templates", label: "Templates" },
  { key: "social", label: "Social" },
  { key: "presentation", label: "Presentation" },
  { key: "images", label: "Images" },
  { key: "downloads", label: "Downloads" },
];

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const isImage = (mime: string) => mime.startsWith("image/");

export default function AssetsPanel({ brandId }: { brandId: number }) {
  const [cat, setCat] = useState<"all" | AssetType>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const listQ = trpc.assets.list.useQuery({
    brandId,
    assetType: cat === "all" ? undefined : cat,
    search: search.trim() || undefined,
  });
  const usageQ = trpc.assets.usage.useQuery({ brandId });
  const urlQ = trpc.assets.url.useQuery(
    { id: selected!, download: false },
    { enabled: selected != null },
  );
  const dlQ = trpc.assets.url.useQuery(
    { id: selected!, download: true },
    { enabled: selected != null },
  );
  const infoQ = trpc.assets.info.useQuery({ id: selected! }, { enabled: selected != null });

  const refresh = () => {
    utils.assets.list.invalidate({ brandId });
    utils.assets.usage.invalidate({ brandId });
  };

  const upload = trpc.assets.upload.useMutation({
    onSuccess: () => refresh(),
    onError: (e) => alert(e.message),
  });
  const remove = trpc.assets.remove.useMutation({
    onSuccess: () => {
      setSelected(null);
      setConfirmDelete(false);
      refresh();
    },
  });

  const onFile = async (file: File) => {
    const contentBase64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const target: AssetType =
      cat !== "all" ? cat : file.type.startsWith("image/") ? "images" : "downloads";
    upload.mutate({ brandId, assetType: target, name: file.name, contentBase64, contentType: file.type });
  };

  const selectedRow = listQ.data?.find((a) => a.id === selected) ?? null;
  const usedMb = (usageQ.data?.usedBytes ?? 0) / 1024 / 1024;
  const limitMb = usageQ.data?.limitMb ?? 0;
  const pct = limitMb > 0 ? Math.min(100, (usedMb / limitMb) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-tech text-[11px] uppercase tracking-[0.24em] text-brand-accent">Asset library</p>
          <h2 className="mt-2 text-3xl">Every file this brand owns</h2>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-ink-soft">
            Logos, guidelines, templates and exports — persisted in cloud object storage,
            isolated to this brand, downloadable any time.
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="btn-clip bg-ink px-5 py-2.5 text-[12px] font-semibold tracking-wide text-paper disabled:opacity-40"
        >
          <span className="btn-mask bg-brand-accent" aria-hidden />
          {upload.isPending ? "Uploading…" : "+ Upload file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* storage entitlement meter (§10) */}
      <div className="mt-6 hairline-panel bg-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Storage — {usedMb.toFixed(1)} MB of {limitMb} MB
            {usageQ.data?.planSlug ? ` (${usageQ.data.planSlug.replace("_", " ").toUpperCase()} plan)` : ""}
          </span>
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            {pct.toFixed(0)}% used
          </span>
        </div>
        <div className="mt-2 h-1 w-full bg-[color:var(--line)]">
          <div className={`h-full transition-all duration-700 ${pct > 90 ? "bg-destructive" : "bg-brand-accent"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* category filter + search */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`border px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors ${
              cat === c.key
                ? "border-ink bg-ink text-paper"
                : "border-[color:var(--line-strong)] text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files…"
          className="ml-auto border border-[color:var(--line-strong)] bg-panel px-3 py-1.5 text-[13px] text-ink outline-none focus:border-brand-accent"
        />
      </div>

      {/* grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(listQ.data ?? []).map((a) => (
          <button
            key={a.id}
            onClick={() => { setSelected(a.id); setConfirmDelete(false); }}
            className={`hairline-panel bg-panel p-4 text-left transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(8,45,79,0.14)] ${
              selected === a.id ? "border-brand-accent" : ""
            }`}
          >
            <div className="flex h-28 items-center justify-center bg-paper">
              {isImage(a.mimeType) ? (
                <AssetThumb id={a.id} alt={a.fileName} />
              ) : (
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  {a.mimeType.split("/")[1] ?? a.mimeType}
                </span>
              )}
            </div>
            <p className="mt-3 truncate text-[13px] font-semibold text-ink">{a.fileName}</p>
            <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              {a.assetType} · v{a.version} · {fmtSize(a.fileSize)}
            </p>
          </button>
        ))}
        {listQ.data && listQ.data.length === 0 && (
          <div className="col-span-full hairline-panel bg-panel px-6 py-14 text-center">
            <p className="font-display text-xl text-ink">No assets here yet.</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              Upload files above — or generate a brand system and its logo, guidelines and exports will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* detail drawer */}
      {selectedRow && (
        <div className="mt-6 hairline-panel bg-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{selectedRow.fileName}</p>
              <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {selectedRow.assetType} · {selectedRow.mimeType} · {fmtSize(selectedRow.fileSize)} · v
                {selectedRow.version} · {fmtDate(selectedRow.createdAt)}
              </p>
              {infoQ.data?.meta && (
                <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  Provider {infoQ.data.storageProvider} · etag {infoQ.data.meta.etag ?? "—"} · updated{" "}
                  {fmtDate(infoQ.data.meta.lastModified ?? selectedRow.updatedAt)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {dlQ.data?.url && (
                <a
                  href={dlQ.data.url}
                  download={selectedRow.fileName}
                  className="border border-[color:var(--line-strong)] px-4 py-2 text-[12px] font-semibold text-ink hover:border-ink"
                >
                  Download
                </a>
              )}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="border border-destructive/50 px-4 py-2 text-[12px] font-semibold text-destructive hover:bg-destructive hover:text-white"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => remove.mutate({ id: selectedRow.id })}
                  disabled={remove.isPending}
                  className="bg-destructive px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
                >
                  {remove.isPending ? "Deleting…" : "Confirm delete"}
                </button>
              )}
            </div>
          </div>
          {isImage(selectedRow.mimeType) && urlQ.data?.url && (
            <div className="brand-grid-bg-fine mt-5 flex max-h-72 items-center justify-center border border-[color:var(--line)] bg-paper p-8">
              <img src={urlQ.data.url} alt={selectedRow.fileName} className="max-h-60 max-w-full object-contain" />
            </div>
          )}
          {confirmDelete && (
            <p className="mt-4 border border-destructive/40 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              This removes the file from cloud storage and the asset library permanently.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AssetThumb({ id, alt }: { id: number; alt: string }) {
  const q = trpc.assets.url.useQuery({ id, download: false });
  if (!q.data?.url) return <span className="font-mono-tech text-[10px] text-ink-faint">…</span>;
  return <img src={q.data.url} alt={alt} className="max-h-full max-w-full object-contain" />;
}
