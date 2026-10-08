import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { BrandData } from "@contracts/brand";
import { runBrandChecks } from "@/lib/brandChecker";
import { ensureFontsForRefs, fontStack } from "@/lib/fontLibrary";

function PanelHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">{n}</p>
      <h1 className="mt-2 text-3xl">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  );
}

// ---------------- Versions ----------------

export function VersionsPanel({ brandId, currentVersion }: { brandId: number; currentVersion: number }) {
  const utils = trpc.useUtils();
  const versions = trpc.brands.versions.useQuery({ id: brandId });
  const restore = trpc.brands.restore.useMutation({
    onSuccess: () => {
      utils.brands.get.invalidate({ id: brandId });
      utils.brands.versions.invalidate({ id: brandId });
    },
  });
  const [confirming, setConfirming] = useState<number | null>(null);

  return (
    <div>
      <PanelHead n="14" title="Version history" sub="Every meaningful change creates a version. Compare, rename in your notes, restore with confidence." />
      <div className="space-y-3">
        {(versions.data ?? []).map((v) => (
          <div key={v.id} className={`hairline-panel flex flex-wrap items-center justify-between gap-4 bg-panel p-5 ${v.version === currentVersion ? "border-ink" : ""}`}>
            <div>
              <p className="font-mono-tech text-[12px] tracking-[0.14em] text-ink">
                v{(v.version / 10).toFixed(1)}
                {v.version === currentVersion && <span className="ml-2 text-brand-accent">— current</span>}
              </p>
              <p className="mt-1 text-[13px] text-ink-soft">{v.label}</p>
              <p className="mt-0.5 font-mono-tech text-[10px] text-ink-faint">{v.createdAt.toLocaleString()}</p>
            </div>
            {v.version !== currentVersion && (
              confirming === v.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ink-soft">Restore this version?</span>
                  <button
                    onClick={() => restore.mutate({ id: brandId, versionId: v.id })}
                    disabled={restore.isPending}
                    className="bg-brand-accent px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
                  >
                    {restore.isPending ? "Restoring…" : "Confirm"}
                  </button>
                  <button onClick={() => setConfirming(null)} className="border border-[color:var(--line-strong)] px-4 py-2 text-[11px] font-semibold text-ink">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirming(v.id)} className="border border-[color:var(--line-strong)] px-4 py-2 text-[11px] font-semibold text-ink hover:bg-ink hover:text-paper">
                  Restore
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Guidelines ----------------

export function GuidelinesPanel({ data, brandName, brandId }: { data: BrandData; brandName: string; brandId: number }) {
  const pages: [string, React.ReactNode][] = [
    ["01 — Brand overview", <OverviewPage key="o" data={data} brandName={brandName} brandId={brandId} />],
    ["02 — Brand DNA", <DnaPage key="d" data={data} />],
    ["03 — Logo usage", <LogoPage key="l" data={data} />],
    ["04 — Colour", <ColourPage key="c" data={data} />],
    ["05 — Typography", <TypePage key="t" data={data} />],
    ["06 — Voice", <VoicePage key="v" data={data} />],
    ["07 — Do's & don'ts", <RulesPage key="r" data={data} />],
    ["08 — Photography & imagery", <PhotographyPage key="p" data={data} brandId={brandId} />],
  ];
  return (
    <div>
      <PanelHead n="15" title="Brand guidelines" sub="Compiled automatically from the structured system — never assembled by hand, never out of sync. Export to PDF via your browser's print dialog." />
      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => window.print()} className="btn-clip bg-ink px-5 py-2.5 text-[12px] font-semibold text-paper">
          <span className="btn-mask bg-brand-accent" aria-hidden />Export as PDF (print)
        </button>
      </div>
      <div className="space-y-8 print:space-y-0">
        {pages.map(([label, node]) => (
          <div key={label} className="guideline-page border border-[color:var(--line)] bg-white p-8 shadow-[0_10px_30px_rgba(8,45,79,0.08)] md:p-12">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">{brandName} — Brand Guidelines</p>
            <h2 className="mt-2 border-b border-[color:var(--line)] pb-4 text-3xl">{label}</h2>
            <div className="mt-6">{node}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuidelinesImage({ id, alt }: { id: number; alt: string }) {
  const q = trpc.assets.url.useQuery({ id, download: false });
  if (!q.data?.url) return <div className="flex h-full items-center justify-center font-mono-tech text-[10px] text-ink-faint">…</div>;
  return <img src={q.data.url} alt={alt} className="h-full w-full object-cover" />;
}

function OverviewImageryBand({ brandId }: { brandId: number }) {
  const launchQ = trpc.imagery.launchStatus.useQuery({ brandId });
  const inFlight = launchQ.data?.inFlight ?? false;
  const listQ = trpc.imagery.list.useQuery({ brandId }, { refetchInterval: inFlight ? 8000 : false });
  const items = (listQ.data ?? []).slice(0, 3);
  if (listQ.isLoading || (items.length === 0 && !inFlight)) return null;
  return (
    <div className="mt-8">
      <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Imagery direction — reference frames</p>
      {items.length === 0 && inFlight ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex aspect-[3/2] items-center justify-center border border-dashed border-[color:var(--line)]">
              <span className="px-2 text-center font-mono-tech text-[9px] leading-relaxed tracking-[0.08em] text-ink-faint">
                Generating…
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {items.map((a) => (
            <div key={a.id} className="aspect-[3/2] overflow-hidden border border-[color:var(--line)]">
              <GuidelinesImage id={a.id} alt={a.fileName} />
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 font-mono-tech text-[9px] leading-relaxed tracking-[0.08em] text-ink-faint">
        AI-generated reference imagery — not a photograph of a real product.
      </p>
    </div>
  );
}

function OverviewPage({ data, brandName, brandId }: { data: BrandData; brandName: string; brandId: number }) {
  return (
    <div>
      <div className="flex h-28 gap-1">
        {data.colors.list.map((c) => (
          <div key={c.role} className="flex-1" style={{ background: c.hex }} />
        ))}
      </div>
      <h3 className="mt-8 font-display text-4xl leading-tight text-ink">{brandName}</h3>
      <OverviewImageryBand brandId={brandId} />
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{data.dna.essence}</p>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{data.dna.positioning}</p>
      <div className="mt-8 grid grid-cols-3 gap-6 border-t border-[color:var(--line)] pt-6">
        <div><p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Personality</p><p className="mt-1.5 font-display text-lg text-ink">{data.personality.join(" · ")}</p></div>
        <div><p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Typefaces</p><p className="mt-1.5 font-display text-lg text-ink">{data.typography.heading.family} + {data.typography.body.family}</p></div>
        <div><p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Applications</p><p className="mt-1.5 font-display text-lg text-ink">{data.applications.length} contexts</p></div>
      </div>
    </div>
  );
}

function PhotographyPage({ data, brandId }: { data: BrandData; brandId: number }) {
  const launchQ = trpc.imagery.launchStatus.useQuery({ brandId });
  const inFlight = launchQ.data?.inFlight ?? false;
  const listQ = trpc.imagery.list.useQuery({ brandId }, { refetchInterval: inFlight ? 8000 : false });
  const items = listQ.data ?? [];
  const photos = items.filter((a) => a.fileName.startsWith("AI photography") || a.fileName.startsWith("AI reference"));
  const mockups = items.filter((a) => a.fileName.startsWith("AI mockup"));
  const rows: [string, string][] = [
    ["Subject", data.photography.subject],
    ["Lighting", data.photography.lighting],
    ["Composition", data.photography.composition],
    ["Colour treatment", data.photography.colour],
    ["People", data.photography.people],
    ["What to avoid", data.photography.avoid],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-brand-accent">{k}</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{v}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Reference frames</p>
        {photos.length === 0 ? (
          <p className="mt-3 border border-dashed border-[color:var(--line)] px-4 py-6 text-center font-mono-tech text-[10px] tracking-[0.08em] text-ink-faint">
            {inFlight ? "Generating your photography frames — this can take a few minutes." : "No frames generated yet."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.slice(0, 6).map((a) => (
              <div key={a.id} className="aspect-[3/2] overflow-hidden border border-[color:var(--line)]">
                <GuidelinesImage id={a.id} alt={a.fileName} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Brand in action — collateral mockups</p>
        {mockups.length === 0 ? (
          <p className="mt-3 border border-dashed border-[color:var(--line)] px-4 py-6 text-center font-mono-tech text-[10px] tracking-[0.08em] text-ink-faint">
            {inFlight ? "Generating your collateral mockups — packaging, stationery and more from your application list." : "No mockups generated yet."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {mockups.slice(0, 4).map((a) => (
              <div key={a.id} className="aspect-[3/2] overflow-hidden border border-[color:var(--line)]">
                <GuidelinesImage id={a.id} alt={a.fileName} />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="font-mono-tech text-[9px] leading-relaxed tracking-[0.08em] text-ink-faint">
        AI-generated reference imagery and mockups — not photographs of real products.
      </p>
    </div>
  );
}

function DnaPage({ data }: { data: BrandData }) {
  const rows: [string, string][] = [
    ["Essence", data.dna.essence], ["Positioning", data.dna.positioning], ["Audience", data.dna.audience],
    ["Promise", data.dna.promise], ["Tone of voice", data.dna.toneOfVoice], ["Visual direction", data.dna.visualDirection],
  ];
  return (
    <div className="space-y-6">
      {rows.map(([k, v]) => (
        <div key={k}>
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-brand-accent">{k}</p>
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-ink">{v}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        {data.dna.keywords.map((k) => (
          <span key={k} className="border border-[color:var(--line-strong)] px-3 py-1 font-mono-tech text-[11px] text-ink">{k}</span>
        ))}
      </div>
    </div>
  );
}

function LogoPage({ data }: { data: BrandData }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Clear space</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{data.logo.clearSpace}</p>
        <p className="mt-5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Minimum size</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{data.logo.minSize}</p>
        <p className="mt-5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Backgrounds</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{data.logo.backgrounds}</p>
      </div>
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Incorrect usage</p>
        <ul className="mt-3 space-y-2.5">
          {data.logo.incorrect.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink">
              <span className="mt-0.5 font-mono-tech text-brand-accent">✕</span>{r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ColourPage({ data }: { data: BrandData }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.colors.list.map((c) => (
        <div key={c.role}>
          <div className="h-24 border border-[color:var(--line)]" style={{ background: c.hex }} />
          <p className="mt-2 text-[12px] font-semibold capitalize text-ink">{c.role} — {c.name}</p>
          <p className="font-mono-tech text-[10px] text-ink-faint">{c.hex.toUpperCase()}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{c.usage}</p>
        </div>
      ))}
    </div>
  );
}

function TypePage({ data }: { data: BrandData }) {
  const typo = data.typography;
  useEffect(() => { ensureFontsForRefs([typo.heading, typo.body, typo.mono]); }, [typo]);
  const refFor = (key: "heading" | "body" | "mono") => (key === "heading" ? typo.heading : key === "body" ? typo.body : typo.mono);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[color:var(--line)] pb-4">
        <p className="font-display text-2xl text-ink">{typo.heading.family} + {typo.body.family}</p>
        <p className="font-mono-tech text-[10px] text-ink-faint">{typo.mono.family} for labels</p>
        {typo.ownFonts && (
          <p className="w-full text-[11px] text-ink-faint">
            Owner-declared brand fonts: {typo.ownFonts.headingName || "—"} / {typo.ownFonts.bodyName || "—"}
            {typo.ownFonts.licenseNote ? ` · ${typo.ownFonts.licenseNote}` : ""}
          </p>
        )}
      </div>
      <p className="max-w-2xl text-[14px] leading-relaxed text-ink-soft">{typo.note}</p>
      {typo.styles.map((s) => {
        const ref = refFor(s.fontKey);
        return (
          <div key={s.name} className="border-b border-[color:var(--line)] pb-4">
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">
              {s.name} — {ref.family} {s.weight} · {s.size} · lh {s.lineHeight} · ls {s.letterSpacing}
            </p>
            <p
              className="mt-1.5 text-ink"
              style={{
                fontFamily: fontStack(ref),
                fontWeight: s.weight,
                fontSize: s.role === "display" ? Math.min(s.sizePx, 34) : s.role === "heading" ? Math.min(s.sizePx, 26) : s.role === "body" ? Math.min(s.sizePx, 15) : 11.5,
                letterSpacing: s.letterSpacing,
              }}
            >
              {s.sample}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function VoicePage({ data }: { data: BrandData }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Tone & vocabulary</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{data.voice.tone}</p>
        <p className="mt-2 text-[13px] text-ink-soft">Vocabulary: {data.voice.vocabulary}</p>
        <p className="mt-5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Principles</p>
        <ul className="mt-2 space-y-1.5">
          {data.voice.principles.map((p) => <li key={p} className="text-[13px] text-ink">— {p}</li>)}
        </ul>
      </div>
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Headlines</p>
        <ul className="mt-2 space-y-1.5">
          {data.voice.headlines.map((h) => <li key={h} className="font-display text-[15px] text-ink">{h}</li>)}
        </ul>
        <p className="mt-5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Calls to action</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.voice.ctas.map((c) => <span key={c} className="border border-[color:var(--line-strong)] px-3 py-1 text-[11.5px] text-ink">{c}</span>)}
        </div>
      </div>
    </div>
  );
}

function RulesPage({ data }: { data: BrandData }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ok">Do</p>
        <ul className="mt-3 space-y-2.5">
          {data.rules.do.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13.5px] text-ink"><span className="text-ok">✓</span>{r}</li>
          ))}
          {data.voice.dos.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13.5px] text-ink"><span className="text-ok">✓</span>{r}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-brand-accent">Don't</p>
        <ul className="mt-3 space-y-2.5">
          {data.rules.dont.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13.5px] text-ink"><span className="text-brand-accent">✕</span>{r}</li>
          ))}
          {data.voice.donts.map((r) => (
            <li key={r} className="flex items-start gap-3 text-[13.5px] text-ink"><span className="text-brand-accent">✕</span>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------- Brand Portal ----------------

export function PortalPanel({ brandId, enabled, brandName }: { brandId: number; enabled: boolean; brandName: string }) {
  const utils = trpc.useUtils();
  const setPortal = trpc.brands.setPortal.useMutation({
    onSuccess: () => utils.brands.get.invalidate({ id: brandId }),
  });
  const [showKeyHint, setShowKeyHint] = useState(false);

  return (
    <div>
      <PanelHead n="16" title="Brand portal" sub="Publish the living source of truth for your team — guidelines, logos, colours, downloads. Access-controlled; comes from the system, so it's never stale." />
      <div className="hairline-panel bg-panel p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Portal address</p>
            <code className="mt-2 block font-mono-tech text-[15px] text-ink">
              {window.location.origin}/portal/{brandId}
            </code>
            <p className="mt-1 text-[12px] text-ink-soft">
              Serves <strong>{brandName}</strong> — {enabled ? "publicly accessible" : "currently private"}.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPortal.mutate({ id: brandId, enabled: !enabled })}
              disabled={setPortal.isPending}
              className={`relative h-8 w-16 transition-colors duration-300 ${enabled ? "bg-ok" : "bg-[color:var(--line-strong)]"}`}
            >
              <span className={`absolute top-1 h-6 w-6 bg-white transition-all duration-300 ${enabled ? "left-9" : "left-1"}`} style={{ transitionTimingFunction: "var(--ease-reveal)" }} />
            </button>
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-soft">{enabled ? "Published" : "Private"}</span>
          </div>
        </div>
        {enabled && (
          <div className="mt-6 border-t border-[color:var(--line)] pt-5">
            <button onClick={() => setShowKeyHint(true)} className="text-[12px] font-semibold text-brand-accent underline-offset-4 hover:underline">
              View portal access options
            </button>
            {showKeyHint && (
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-soft">
                The portal is readable by anyone with the link while published. To restrict
                it to your team, unpublish — your studio remains the single source of truth.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Brand Checker ----------------

export function CheckerPanel({ data }: { data: BrandData }) {
  const results = runBrandChecks(data);
  const counts = {
    pass: results.filter((r) => r.status === "pass").length,
    warn: results.filter((r) => r.status === "warn").length,
    fail: results.filter((r) => r.status === "fail").length,
  };
  const pct = Math.round((counts.pass / results.length) * 100);
  return (
    <div>
      <PanelHead n="17" title="Brand checker" sub="Objective, rules-based checks — accessibility contrast, token sync, completeness. Objective design-system checks never rely on AI." />
      <div className="hairline-panel mb-8 flex flex-wrap items-center gap-8 bg-panel p-6">
        <div>
          <p className="font-display text-5xl text-ink">{pct}%</p>
          <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">system health</p>
        </div>
        <div className="flex gap-5">
          <span className="text-[13px] text-ok">{counts.pass} passing</span>
          <span className="text-[13px] text-warn">{counts.warn} warnings</span>
          <span className="text-[13px] text-brand-accent">{counts.fail} failing</span>
        </div>
        <div className="h-2 min-w-40 flex-1 bg-[color:var(--line)]">
          <div className="h-full bg-ok transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.id} className="hairline-panel flex items-start gap-4 bg-panel p-5">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center font-mono-tech text-[11px] text-white ${
                r.status === "pass" ? "bg-ok" : r.status === "warn" ? "bg-warn" : "bg-brand-accent"
              }`}
            >
              {r.status === "pass" ? "✓" : r.status === "warn" ? "!" : "✕"}
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">
                {r.label} <span className="ml-2 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">{r.area}</span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- AI Studio ----------------

export function AiStudioPanel({ data }: { data: BrandData }) {
  const copy = trpc.ai.studioCopy.useMutation();
  const [channel, setChannel] = useState("Website hero");
  const result = copy.data;

  return (
    <div>
      <PanelHead n="18" title="AI studio" sub="WRITE mode: headlines, captions and CTAs generated from your structured brand system and verified voice. Your locked elements are never touched." />
      <div className="hairline-panel bg-ink p-6 text-paper">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-paper/50">Channel / context</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Website hero", "Instagram caption", "Launch campaign", "Email subject"].map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`border px-3.5 py-2 text-[12.5px] transition-colors ${channel === c ? "border-brand-accent bg-brand-accent text-white" : "border-paper/25 text-paper/80 hover:border-paper/60"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => copy.mutate({ brandName: data.brand.name, dna: data.dna, voice: data.voice, channel })}
          disabled={copy.isPending}
          className="btn-clip mt-5 bg-brand-accent px-6 py-3 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          <span className="btn-mask bg-paper" aria-hidden />
          <span className="relative z-10 transition-colors duration-500 hover:text-ink">
            {copy.isPending ? "Writing in your voice…" : `Write for ${channel}`}
          </span>
        </button>
        {copy.error && (
          <p className="mt-4 border border-brand-accent/50 bg-brand-accent/10 px-4 py-3 text-[12.5px] leading-relaxed text-paper">
            {copy.error.message}
          </p>
        )}
      </div>

      {result && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {([
            ["Headlines", result.headlines],
            ["Captions", result.captions],
            ["CTAs", result.ctas],
          ] as const).map(([label, items]) => (
            <div key={label} className="hairline-panel bg-panel p-5">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</p>
              <ul className="mt-3 space-y-2.5">
                {items.map((t) => (
                  <li key={t} className="border-l-2 border-brand-accent pl-3 text-[13.5px] leading-relaxed text-ink">{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-[12px] leading-relaxed text-ink-faint">
        AI is optional: this studio, your system and every export work without it.
        AI calls are billed to the workspace owner — use deliberately.
      </p>
    </div>
  );
}

// ---------------- Settings ----------------

export function SettingsPanel({ brandId, name, onDeleted }: { brandId: number; name: string; onDeleted: () => void }) {
  const utils = trpc.useUtils();
  const [newName, setNewName] = useState(name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rename = trpc.brands.rename.useMutation({
    onSuccess: () => { utils.brands.get.invalidate({ id: brandId }); utils.brands.list.invalidate(); },
  });
  const del = trpc.brands.delete.useMutation({ onSuccess: onDeleted });

  return (
    <div>
      <PanelHead n="19" title="Settings" sub="Workspace-level controls. The brand and its data belong to you." />
      <div className="hairline-panel bg-panel p-6">
        <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Brand name</label>
        <div className="mt-2 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-w-0 flex-1 border border-[color:var(--line-strong)] bg-paper px-3 py-2.5 text-[14px] outline-none focus:border-brand-accent"
          />
          <button
            onClick={() => rename.mutate({ id: brandId, name: newName })}
            disabled={!newName.trim() || rename.isPending}
            className="bg-ink px-5 text-[12px] font-semibold text-paper disabled:opacity-40"
          >
            Rename
          </button>
        </div>
      </div>
      <div className="mt-6 hairline-panel border-brand-accent/40 bg-brand-accent/5 p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-brand-accent">Danger zone</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="mt-3 border border-brand-accent px-4 py-2 text-[12px] font-semibold text-brand-accent hover:bg-brand-accent hover:text-white">
            Delete this brand system…
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-ink">This deletes the brand and all its versions. This cannot be undone.</span>
            <button onClick={() => del.mutate({ id: brandId })} disabled={del.isPending} className="bg-brand-accent px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">
              {del.isPending ? "Deleting…" : "Yes, delete it"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="border border-[color:var(--line-strong)] px-4 py-2 text-[12px] font-semibold text-ink">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
