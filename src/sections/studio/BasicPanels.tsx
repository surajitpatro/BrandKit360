import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { BrandColor, BrandData, FontRef, TypeHierarchy, TypeStyle, TypographySystem } from "@contracts/brand";
import { colorCodes, contrastRatio, contrastRating, readableOn, rotateHue, tint } from "@/lib/colorUtils";
import { regeneratePalette } from "@/lib/generator";
import { buildTypeStyles, ensureFontsForRefs, fontStack, styleFont } from "@/lib/fontLibrary";
import { FontPicker } from "@/components/FontPicker";
import { BrandPreview } from "@/components/BrandPreview";

export type UpdateFn = (fn: (d: BrandData) => BrandData) => void;

function PanelHead({ n, title, sub, right }: { n: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">{n}</p>
        <h1 className="mt-2 text-3xl">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function LockButton({ locked, onToggle, label }: { locked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 border px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors ${
        locked ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] text-ink hover:border-ink"
      }`}
    >
      <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
        <rect x="1" y="5" width="9" height="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {locked ? `${label} — locked` : `Lock ${label}`}
    </button>
  );
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------- Overview ----------------

export function OverviewPanel({ data, brandName }: { data: BrandData; brandName: string }) {
  return (
    <div>
      <PanelHead n="00" title="Brand overview" sub="A concise visual summary of the whole system — the first page of your guidelines." />
      <div className="hairline-panel bg-panel p-8 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">{brandName}</p>
            <h2 className="mt-2 max-w-md font-display text-3xl leading-tight text-ink">{data.dna.essence}</h2>
          </div>
          <div className="flex h-20 w-40 gap-1">
            {data.colors.list.map((c) => (
              <span key={c.role} className="flex-1" style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-6 border-t border-[color:var(--line)] pt-8 md:grid-cols-3">
          <div>
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Personality</p>
            <p className="mt-2 font-display text-lg text-ink">{data.personality.join(" · ")}</p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Typography</p>
            <p className="mt-2 font-display text-lg text-ink">{data.typography.heading.family} + {data.typography.body.family}</p>
          </div>
          <div>
            <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">Applications</p>
            <p className="mt-2 font-display text-lg text-ink">{data.applications.length} contexts specified</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Brand DNA ----------------

export function DnaPanel({ data, update }: { data: BrandData; update: UpdateFn }) {
  const fields: [keyof BrandData["dna"], string][] = [
    ["essence", "Brand Essence"], ["positioning", "Positioning"], ["audience", "Audience"],
    ["promise", "Brand Promise"], ["toneOfVoice", "Tone of Voice"], ["visualDirection", "Visual Direction"],
  ];
  return (
    <div>
      <PanelHead n="01" title="Brand DNA" sub="The strategic core. Every field is editable; the system updates what depends on it — not the whole brand." />
      <div className="space-y-4">
        {fields.map(([key, label]) => (
          <div key={key} className="hairline-panel bg-panel p-5">
            <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</label>
            <textarea
              value={data.dna[key]}
              rows={key === "essence" || key === "positioning" ? 3 : 2}
              onChange={(e) => update((d) => ({ ...d, dna: { ...d.dna, [key]: e.target.value } }))}
              className="mt-2 w-full resize-y bg-transparent text-[14.5px] leading-relaxed text-ink outline-none"
            />
          </div>
        ))}
        <div className="hairline-panel bg-panel p-5">
          <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Keywords</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.dna.keywords.map((k) => (
              <span key={k} className="border border-[color:var(--line-strong)] bg-paper px-3 py-1 font-mono-tech text-[11px] text-ink">{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Logo ----------------

export function LogoPanel({ data, update, toggleLock }: { data: BrandData; update: UpdateFn; toggleLock: (k: string) => void }) {
  const locked = data.locked.includes("logo");
  const urlQ = trpc.storage.url.useQuery(
    { key: data.logo.assetKey! },
    { enabled: !!data.logo.assetKey },
  );
  return (
    <div>
      <PanelHead
        n="02" title="Logo system"
        sub="Clear space, minimum size, backgrounds, and the incorrect usages that quietly erode brands."
        right={<LockButton locked={locked} onToggle={() => toggleLock("logo")} label="Logo" />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="brand-grid-bg-fine hairline-panel flex min-h-64 items-center justify-center bg-panel p-10">
          {urlQ.data?.url ? (
            <img src={urlQ.data.url} alt="Brand logo" className="max-h-44 max-w-full object-contain" />
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center bg-ink text-paper">
                <span className="font-display text-2xl">{data.brand.name.slice(0, 1).toUpperCase()}</span>
              </div>
              <p className="mt-4 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {data.logo.assetKey ? "Loading logo…" : "No logo file stored — the system uses a placeholder mark"}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {([
            ["Clear space", "clearSpace"],
            ["Minimum size", "minSize"],
            ["Backgrounds", "backgrounds"],
          ] as const).map(([label, key]) => (
            <div key={key} className="hairline-panel bg-panel p-5">
              <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</label>
              <textarea
                value={data.logo[key]}
                rows={2}
                disabled={locked}
                onChange={(e) => update((d) => ({ ...d, logo: { ...d.logo, [key]: e.target.value } }))}
                className="mt-2 w-full resize-y bg-transparent text-[14px] leading-relaxed text-ink outline-none disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 hairline-panel bg-panel p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Incorrect usage — never do these</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {data.logo.incorrect.map((r) => (
            <li key={r} className="flex items-start gap-3 border-l-2 border-brand-accent pl-3 text-[13px] leading-relaxed text-ink">
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------- Colour ----------------

export function ColourPanel({ data, update, locked, toggleLock }: { data: BrandData; update: UpdateFn; locked: boolean; toggleLock: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const setColor = (role: string, patch: Partial<BrandColor>) =>
    update((d) => {
      const list = d.colors.list.map((c) => (c.role === role ? { ...c, ...patch } : c));
      const tokens = { ...d.tokens };
      const map: Record<string, string> = { primary: "color-primary", secondary: "color-secondary", accent: "color-accent", neutral: "color-neutral", background: "color-background", text: "color-text" };
      const hex = patch.hex ?? list.find((c) => c.role === role)?.hex;
      if (map[role] && hex) tokens.color = { ...tokens.color, [map[role]]: hex };
      return { ...d, colors: { list }, tokens };
    });

  const bg = data.colors.list.find((c) => c.role === "background");
  const accent = data.colors.list.find((c) => c.role === "accent");

  return (
    <div>
      <PanelHead
        n="03" title="Colour system"
        sub="Every value is a token. Change one and dependent components, templates and exports update. Locked colours can't be edited or regenerated."
        right={<LockButton locked={locked} onToggle={toggleLock} label="Colours" />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {data.colors.list.map((c) => {
          const codes = colorCodes(c.hex);
          const onBg = bg ? contrastRatio(c.hex, bg.hex) : 1;
          const rating = contrastRating(onBg);
          return (
            <div key={c.role} className="hairline-panel overflow-hidden bg-panel">
              <div className="relative h-28" style={{ background: c.hex }}>
                <span className="absolute bottom-3 left-4 font-mono-tech text-[10px] uppercase tracking-[0.16em]" style={{ color: readableOn(c.hex) }}>
                  {c.role}
                </span>
                <span className="absolute right-3 top-3 border border-black/10 px-2 py-0.5 font-mono-tech text-[9px] tracking-[0.12em]" style={{ color: readableOn(c.hex), background: "rgba(255,255,255,0.12)" }}>
                  on-bg {onBg.toFixed(1)}:1 {rating.label}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  {editing === c.role && !locked ? (
                    <input
                      autoFocus
                      defaultValue={c.hex}
                      onBlur={(e) => { setColor(c.role, { hex: e.target.value }); setEditing(null); }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className="w-24 border border-[color:var(--line-strong)] bg-paper px-2 py-1 font-mono-tech text-[12px] outline-none focus:border-brand-accent"
                    />
                  ) : (
                    <p className="font-semibold text-ink">{c.name}</p>
                  )}
                  <div className="flex gap-1.5">
                    {!locked && (
                      <>
                        <button onClick={() => setEditing(c.role)} className="border border-[color:var(--line-strong)] px-2.5 py-1 text-[10.5px] font-semibold text-ink hover:bg-ink hover:text-paper">Edit</button>
                        <button
                          onClick={() => {
                            const i = data.colors.list.findIndex((x) => x.role === c.role);
                            const pool = ["#0A2A4A", "#1E5631", "#5B2A4A", "#0F4C5C", "#C4572E", "#1F3BFF", "#A67C37", "#6B7A3A"];
                            const next = pool[(i * 3 + c.name.length) % pool.length];
                            if (next.toLowerCase() !== c.hex.toLowerCase()) setColor(c.role, { hex: next });
                          }}
                          className="border border-[color:var(--line-strong)] px-2.5 py-1 text-[10.5px] font-semibold text-ink hover:bg-ink hover:text-paper"
                        >
                          Regenerate
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{c.usage}</p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[color:var(--line)] pt-3 font-mono-tech text-[10.5px] text-ink-faint">
                  <span>{codes.hex}</span><span>RGB {codes.rgb}</span>
                  <span>{codes.cmyk}</span><span>{codes.hsl}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!locked && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              update((d) => ({ ...d, visual_direction: { ...d.visual_direction, paletteFamily: "custom" } }))
            }
            className="border border-[color:var(--line-strong)] px-5 py-3 text-[12px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            title="Mark the current palette as the decided direction"
          >
            Keep existing colours
          </button>
          <button
            onClick={() =>
              update((d) => {
                // refresh: same family, same primary — rotate the accent hue and
                // re-derive the secondary from it (deterministic per current accent)
                const list = d.colors.list.map((c) => {
                  if (c.role === "accent") {
                    const dir = c.hex.length % 2 === 0 ? 28 : -28;
                    const hex = rotateHue(c.hex, dir);
                    return { ...c, hex, name: c.name.split(" · ")[0] + " · refreshed" };
                  }
                  if (c.role === "secondary") {
                    const accent = d.colors.list.find((x) => x.role === "accent");
                    if (accent) return { ...c, hex: tint(rotateHue(accent.hex, accent.hex.length % 2 === 0 ? 28 : -28), 0.45), name: c.name.split(" · ")[0] + " · refreshed" };
                  }
                  return c;
                });
                const tokens = { ...d.tokens, color: { ...d.tokens.color } };
                const map: Record<string, string> = { primary: "color-primary", secondary: "color-secondary", accent: "color-accent", neutral: "color-neutral", background: "color-background", text: "color-text" };
                list.forEach((c) => { tokens.color[map[c.role]] = c.hex; });
                return { ...d, colors: { list }, tokens };
              })
            }
            className="border border-[color:var(--line-strong)] px-5 py-3 text-[12px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Refresh existing colours
          </button>
          <button
            onClick={() =>
              update((d) => {
                const next = regeneratePalette(
                  { brandName: d.brand.name, business: d.brand.business, audience: d.brand.audience, personality: d.personality, usage: d.meta.usage, admired: d.meta.admired, avoid: d.meta.avoid, paletteFamilyId: d.visual_direction.paletteFamily },
                  d.visual_direction.paletteFamily,
                );
                const tokens = { ...d.tokens, color: { ...d.tokens.color } };
                const map = ["color-primary", "color-secondary", "color-accent", "color-neutral", "color-background", "color-text"];
                next.list.forEach((c, i) => (tokens.color[map[i]] = c.hex));
                return { ...d, colors: next, tokens, visual_direction: { ...d.visual_direction, paletteFamily: "custom" } };
              })
            }
            className="btn-clip border border-[color:var(--line-strong)] px-5 py-3 text-[12px] font-semibold text-ink"
          >
            <span className="btn-mask bg-ink" aria-hidden />
            <span className="relative z-10 transition-colors duration-500 hover:text-paper">Explore a completely new palette</span>
          </button>
          {data.visual_direction.paletteFamily === "custom" && (
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ok">Direction decided</span>
          )}
        </div>
      )}
      <div className="mt-8">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Live brand preview</p>
        <div className="mt-3 max-w-xl">
          <BrandPreview colors={data.colors.list} typography={data.typography} brandName={data.brand.name} essence={data.dna.essence} compact />
        </div>
      </div>
      {accent && bg && (
        <p className="mt-4 text-[12px] text-ink-soft">
          Accent on background: {contrastRatio(accent.hex, bg.hex).toFixed(2)}:1 —{" "}
          {contrastRatio(accent.hex, bg.hex) >= 3 ? "clear for calls to action." : "weak; consider a deeper accent."}
        </p>
      )}
    </div>
  );
}

// ---------------- Typography ----------------

const SCALE_PRESETS = [
  { label: "Minor third", value: 1.2 },
  { label: "Major third", value: 1.25 },
  { label: "Perfect fourth", value: 1.333 },
  { label: "Augmented fourth", value: 1.414 },
  { label: "Golden", value: 1.5 },
];
const BASE_SIZES = [14, 15, 16, 17, 18];

export function TypographyPanel({ data, update, locked, toggleLock }: { data: BrandData; update: UpdateFn; locked: boolean; toggleLock: () => void }) {
  const typo = data.typography;
  useEffect(() => { ensureFontsForRefs([typo.heading, typo.body, typo.mono]); }, [typo.heading, typo.body, typo.mono]);

  /** Patch a font slot and keep tokens + styles in sync. */
  const setSlot = (slot: "heading" | "body" | "mono", ref: FontRef) =>
    update((d) => {
      const t = { ...d.typography, [slot]: ref };
      const styles = d.typography.styles.map((s) => (s.fontKey === slot ? { ...s, weight: ref.weights.includes(s.weight) ? s.weight : ref.weights[ref.weights.length - 1] } : s));
      return {
        ...d,
        typography: { ...t, styles },
        tokens: { ...d.tokens, font: { ...d.tokens.font, [`font-${slot}`]: fontStack(ref), [`font-${slot}-family`]: ref.family } },
      };
    });

  const toggleWeight = (slot: "heading" | "body" | "mono", w: number) =>
    update((d) => {
      const ref = d.typography[slot];
      const weights = ref.weights.includes(w)
        ? ref.weights.filter((x) => x !== w)
        : [...ref.weights, w].sort((a, b) => a - b);
      if (!weights.length) return d; // keep at least one
      const next = { ...ref, weights };
      const styles = d.typography.styles.map((s) =>
        s.fontKey === slot && !next.weights.includes(s.weight)
          ? { ...s, weight: next.weights[next.weights.length - 1] }
          : s,
      );
      return { ...d, typography: { ...d.typography, [slot]: next, styles } };
    });

  const setHierarchy = (patch: Partial<TypeHierarchy>) =>
    update((d) => {
      const hierarchy = { ...d.typography.hierarchy, ...patch };
      const styles = buildTypeStyles(d.typography.heading, d.typography.body, d.typography.mono, hierarchy, styleWeights(d.typography.styles));
      return { ...d, typography: { ...d.typography, hierarchy, styles } };
    });

  const setStyleWeight = (name: string, weight: number) =>
    update((d) => ({
      ...d,
      typography: { ...d.typography, styles: d.typography.styles.map((s) => (s.name === name ? { ...s, weight } : s)) },
    }));

  const setOwnFonts = (patch: Partial<NonNullable<TypographySystem["ownFonts"]>> | null) =>
    update((d) => ({
      ...d,
      typography: {
        ...d.typography,
        ownFonts: patch === null ? null : { headingName: "", bodyName: "", licenseNote: "", ...d.typography.ownFonts, ...patch },
      },
    }));

  const slots: { slot: "heading" | "body" | "mono"; label: string; hint: string }[] = [
    { slot: "heading", label: "Heading font", hint: "Display, H1–H3" },
    { slot: "body", label: "Body font", hint: "Body, captions" },
    { slot: "mono", label: "Mono / labels", hint: "Tokens, labels, data" },
  ];

  return (
    <div>
      <PanelHead
        n="04" title="Typography system"
        sub="Real fonts from the library, live previews, weights and a type scale — stored as structured tokens that flow into guidelines, Figma output, CSS, templates, portal and AI Studio."
        right={<LockButton locked={locked} onToggle={toggleLock} label="Typography" />}
      />

      {/* own fonts declaration */}
      <div className="hairline-panel mb-6 bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">I already have my brand fonts</p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">
              Declare your licensed typefaces — the system records them, uses them everywhere, and previews fall back gracefully if the font isn't installed.
            </p>
          </div>
          <button
            onClick={() => setOwnFonts(typo.ownFonts ? null : {})}
            disabled={locked}
            className={`border px-4 py-2 text-[12px] font-semibold transition-colors disabled:opacity-40 ${
              typo.ownFonts ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] text-ink hover:border-ink"
            }`}
          >
            {typo.ownFonts ? "Using my own fonts — turn off" : "Use my own fonts"}
          </button>
        </div>
        {typo.ownFonts && (
          <div className="mt-4 grid gap-3 border-t border-[color:var(--line)] pt-4 md:grid-cols-3">
            <label className="block">
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">Heading typeface name</span>
              <input
                value={typo.ownFonts.headingName}
                disabled={locked}
                onChange={(e) => setOwnFonts({ headingName: e.target.value })}
                placeholder="e.g. Neue Haas Grotesk Display"
                className="mt-1.5 w-full border border-[color:var(--line-strong)] bg-paper px-3 py-2 text-[13px] outline-none focus:border-brand-accent disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">Body typeface name</span>
              <input
                value={typo.ownFonts.bodyName}
                disabled={locked}
                onChange={(e) => setOwnFonts({ bodyName: e.target.value })}
                placeholder="e.g. Neue Haas Grotesk Text"
                className="mt-1.5 w-full border border-[color:var(--line-strong)] bg-paper px-3 py-2 text-[13px] outline-none focus:border-brand-accent disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">Licence note</span>
              <input
                value={typo.ownFonts.licenseNote}
                disabled={locked}
                onChange={(e) => setOwnFonts({ licenseNote: e.target.value })}
                placeholder="e.g. Licensed via Adobe Fonts — Team seat"
                className="mt-1.5 w-full border border-[color:var(--line-strong)] bg-paper px-3 py-2 text-[13px] outline-none focus:border-brand-accent disabled:opacity-50"
              />
            </label>
          </div>
        )}
      </div>

      {/* font slots */}
      <div className="grid gap-4 lg:grid-cols-3">
        {slots.map(({ slot, label, hint }) => {
          const ref = typo[slot];
          return (
            <div key={slot} className="hairline-panel bg-panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</p>
                <p className="font-mono-tech text-[9px] text-ink-faint">{hint}</p>
              </div>
              <div className="mt-3">
                <FontPicker
                  bestFor={slot}
                  value={ref}
                  disabled={locked}
                  onChange={(next) => setSlot(slot, next)}
                />
              </div>
              <p className="mt-3 break-words text-[13px] leading-snug text-ink-soft" style={{ fontFamily: fontStack(ref) }}>
                {SLOT_SAMPLE[slot]}
              </p>
              {/* weights */}
              <div className="mt-4 border-t border-[color:var(--line)] pt-3">
                <p className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">Weights in use</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ref.availableWeights.map((w) => (
                    <button
                      key={w}
                      disabled={locked}
                      onClick={() => toggleWeight(slot, w)}
                      className={`border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 ${
                        ref.weights.includes(w)
                          ? "border-ink bg-ink text-paper"
                          : "border-[color:var(--line-strong)] text-ink hover:border-ink"
                      }`}
                      style={ref.weights.includes(w) ? { fontFamily: fontStack(ref), fontWeight: w } : undefined}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* hierarchy */}
      <div className="mt-6 hairline-panel bg-panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Type scale — hierarchy</p>
          <p className="font-mono-tech text-[9px] text-ink-faint">
            base {typo.hierarchy.baseSize}px × {typo.hierarchy.scale} ratio
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-ink-faint">Base</span>
            <div className="flex gap-1">
              {BASE_SIZES.map((b) => (
                <button
                  key={b}
                  disabled={locked}
                  onClick={() => setHierarchy({ baseSize: b })}
                  className={`border px-2.5 py-1 font-mono-tech text-[11px] disabled:opacity-40 ${typo.hierarchy.baseSize === b ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] text-ink"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-ink-faint">Ratio</span>
            {SCALE_PRESETS.map((s) => (
              <button
                key={s.label}
                disabled={locked}
                onClick={() => setHierarchy({ scale: s.value })}
                className={`border px-2.5 py-1 text-[11px] disabled:opacity-40 ${Math.abs(typo.hierarchy.scale - s.value) < 0.001 ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] text-ink"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* style ladder */}
      <div className="mt-6 space-y-px border border-[color:var(--line)] bg-[color:var(--line)]">
        {typo.styles.map((s) => {
          const ref = styleFont(typo, s);
          const previewSize = Math.min(s.sizePx, s.role === "display" ? 40 : s.sizePx);
          return (
            <div key={s.name} className="flex flex-wrap items-baseline gap-x-8 gap-y-2 bg-panel px-6 py-5">
              <div className="w-36 shrink-0">
                <p className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-ink-faint">{s.name}</p>
                <p className="font-mono-tech text-[9px] text-ink-faint">{s.size} / lh {s.lineHeight} / ls {s.letterSpacing}</p>
                <select
                  value={s.weight}
                  disabled={locked}
                  onChange={(e) => setStyleWeight(s.name, Number(e.target.value))}
                  className="mt-1.5 border border-[color:var(--line-strong)] bg-paper px-1.5 py-1 font-mono-tech text-[10px] outline-none disabled:opacity-40"
                  aria-label={`${s.name} weight`}
                >
                  {ref.weights.map((w) => (
                    <option key={w} value={w}>{ref.family} {w}</option>
                  ))}
                </select>
              </div>
              <p
                className="min-w-0 flex-1 text-ink"
                style={{
                  fontFamily: fontStack(ref),
                  fontWeight: s.weight,
                  fontSize: s.role === "display" ? Math.min(previewSize, 42) : s.role === "heading" ? Math.min(previewSize, 30) : s.role === "body" ? Math.min(previewSize, 17) : 12,
                  letterSpacing: s.letterSpacing,
                  lineHeight: s.lineHeight,
                }}
              >
                {s.sample}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
        Locked typography can't be regenerated or edited — AI Studio and refresh tools respect the lock.
        {typo.ownFonts?.licenseNote ? ` Licence on file: ${typo.ownFonts.licenseNote}` : ""}
      </p>
    </div>
  );
}

const SLOT_SAMPLE: Record<"heading" | "body" | "mono", string> = {
  heading: "Considered quality, delivered without noise.",
  body: "Every touchpoint reads clearly — from the first impression to the hundredth.",
  mono: "FIG.04 — TOKEN / 0123456789",
};

function styleWeights(styles: TypeStyle[]): { display?: number; h1?: number; h2?: number; h3?: number } {
  const w = (name: string) => styles.find((s) => s.name === name)?.weight;
  return { display: w("Display"), h1: w("H1"), h2: w("H2"), h3: w("H3") };
}

// ---------------- Graphics / Photography / Voice etc. ----------------

function TextBlockPanel({ n, title, sub, value, onChange, rows = 3 }: {
  n: string; title: string; sub: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <PanelHead n={n} title={title} sub={sub} />
      <div className="hairline-panel bg-panel p-6">
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y bg-transparent text-[14.5px] leading-relaxed text-ink outline-none"
        />
      </div>
    </div>
  );
}

export function GraphicsPanel({ data, update }: { data: BrandData; update: UpdateFn }) {
  const entries: [keyof BrandData["graphics"], string][] = [
    ["shapes", "Shapes"], ["patterns", "Patterns"], ["devices", "Graphic devices"], ["imageTreatment", "Image treatment"],
  ];
  return (
    <div>
      <PanelHead n="05" title="Graphic language" sub="How the brand behaves when the logo isn't in the room." />
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([key, label], i) => (
          <div key={key} className="hairline-panel bg-panel p-5">
            <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</label>
            <textarea
              value={data.graphics[key]}
              rows={3}
              onChange={(e) => update((d) => ({ ...d, graphics: { ...d.graphics, [key]: e.target.value } }))}
              className="mt-2 w-full resize-y bg-transparent text-[14px] leading-relaxed text-ink outline-none"
            />
            <div className="mt-3 flex h-8 gap-1" aria-hidden>
              {[0, 1, 2, 3, 4].map((j) => (
                <span key={j} className="flex-1" style={{ background: data.colors.list[(i + j) % data.colors.list.length].hex, opacity: 0.25 + j * 0.15 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhotographyPanel({ data, update, brandId }: { data: BrandData; update: UpdateFn; brandId: number }) {
  const entries: [keyof BrandData["photography"], string][] = [
    ["subject", "Subject matter"], ["lighting", "Lighting"], ["composition", "Composition"],
    ["colour", "Colour treatment"], ["people", "People"], ["avoid", "What to avoid"],
  ];
  return (
    <div>
      <PanelHead n="06" title="Photography direction" sub="What to shoot, how to light it, and the clichés to retire." />
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([key, label]) => (
          <div key={key} className="hairline-panel bg-panel p-5">
            <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</label>
            <textarea
              value={data.photography[key]}
              rows={3}
              onChange={(e) => update((d) => ({ ...d, photography: { ...d.photography, [key]: e.target.value } }))}
              className="mt-2 w-full resize-y bg-transparent text-[14px] leading-relaxed text-ink outline-none"
            />
          </div>
        ))}
      </div>
      <PhotographyImagery brandId={brandId} />
    </div>
  );
}

function ImageryThumb({ id, alt }: { id: number; alt: string }) {
  const q = trpc.assets.url.useQuery({ id, download: false });
  if (!q.data?.url) return <span className="font-mono-tech text-[10px] text-ink-faint">…</span>;
  return <img src={q.data.url} alt={alt} className="h-full w-full object-cover" />;
}

function PhotographyImagery({ brandId }: { brandId: number }) {
  const utils = trpc.useUtils();
  const launchQ = trpc.imagery.launchStatus.useQuery({ brandId });
  const inFlight = launchQ.data?.inFlight ?? false;
  const listQ = trpc.imagery.list.useQuery({ brandId }, { refetchInterval: inFlight ? 8000 : false });
  const generate = trpc.imagery.generate.useMutation({
    onSuccess: () => {
      utils.imagery.list.invalidate({ brandId });
      utils.assets.list.invalidate();
      utils.assets.usage.invalidate({ brandId });
    },
  });
  const remove = trpc.assets.remove.useMutation({
    onSuccess: () => {
      utils.imagery.list.invalidate({ brandId });
      utils.assets.usage.invalidate({ brandId });
    },
  });
  const items = listQ.data ?? [];
  const photos = items.filter((a) => a.fileName.startsWith("AI photography") || a.fileName.startsWith("AI reference"));
  const mockups = items.filter((a) => a.fileName.startsWith("AI mockup"));
  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">06.B</p>
          <h2 className="mt-1 text-xl">Imagery & mockups</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-soft">
            Your launch imagery set is generated automatically from this direction — photography frames and collateral
            mockups with your logo. Each extra generation uses image-generation quota and counts against your plan storage.
          </p>
        </div>
        <button
          onClick={() => generate.mutate({ brandId })}
          disabled={generate.isPending}
          className="border border-ink bg-ink px-4 py-2 text-[12px] font-semibold text-paper transition-opacity disabled:opacity-50"
        >
          {generate.isPending ? "Generating — can take up to a minute…" : "Generate another frame"}
        </button>
      </div>

      {inFlight && (
        <p className="mb-4 border border-[color:var(--line-strong)] bg-panel px-4 py-3 font-mono-tech text-[11px] tracking-[0.08em] text-ink-soft">
          Generating your imagery set — {launchQ.data?.generated ?? 0} of {launchQ.data?.total ?? 5} ready. This can
          take a few minutes; finished frames appear here and in your guidelines automatically.
        </p>
      )}
      {generate.error && (
        <p className="mb-4 border border-[color:var(--line-strong)] bg-panel px-4 py-3 text-[13px] text-brand-accent">
          {generate.error.message}
        </p>
      )}

      {listQ.isLoading ? (
        <p className="font-mono-tech text-[11px] text-ink-faint">Loading…</p>
      ) : items.length === 0 && !inFlight ? (
        <p className="font-mono-tech text-[11px] text-ink-faint">
          No imagery yet — your launch set starts automatically once your plan includes guidelines.
        </p>
      ) : (
        <div className="space-y-8">
          {photos.length > 0 && <ImageryGrid title="Photography direction" items={photos} remove={remove} />}
          {mockups.length > 0 && <ImageryGrid title="Brand in action — collateral mockups" items={mockups} remove={remove} />}
        </div>
      )}
      <p className="mt-4 font-mono-tech text-[10px] leading-relaxed tracking-[0.08em] text-ink-faint">
        AI-generated reference imagery and mockups — not photographs of real products. Images are saved to your Asset
        Library and count against your plan storage.
      </p>
    </div>
  );
}

function ImageryGrid({
  title,
  items,
  remove,
}: {
  title: string;
  items: { id: number; fileName: string }[];
  remove: { mutate: (input: { id: number }) => void; isPending: boolean };
}) {
  return (
    <div>
      <p className="mb-3 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <figure key={a.id} className="hairline-panel overflow-hidden bg-panel">
            <div className="aspect-[3/2] w-full overflow-hidden">
              <ImageryThumb id={a.id} alt={a.fileName} />
            </div>
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="truncate font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {a.fileName}
              </span>
              <button
                onClick={() => remove.mutate({ id: a.id })}
                disabled={remove.isPending}
                className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-brand-accent"
              >
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function VoicePanel({ data, update }: { data: BrandData; update: UpdateFn }) {
  return (
    <div>
      <PanelHead n="07" title="Brand voice" sub="Tone, vocabulary, principles — plus example headlines and CTAs you can lift directly." />
      <div className="space-y-4">
        <TextBlockPanel n="" title="" sub="" value={data.voice.tone} onChange={(v) => update((d) => ({ ...d, voice: { ...d.voice, tone: v } }))} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Do</p>
            <ul className="mt-3 space-y-2">
              {data.voice.dos.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[13px] text-ink"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ok" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Don't</p>
            <ul className="mt-3 space-y-2">
              {data.voice.donts.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[13px] text-ink"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand-accent" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Headline examples</p>
            <ul className="mt-3 space-y-2.5">
              {data.voice.headlines.map((h) => (
                <li key={h} className="border-l-2 border-ink pl-3 font-display text-[15px] text-ink">{h}</li>
              ))}
            </ul>
          </div>
          <div className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">CTA examples</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.voice.ctas.map((c) => (
                <span key={c} className="border border-[color:var(--line-strong)] px-3 py-1.5 text-[12px] font-semibold text-ink">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IllustrationPanel({ data }: { data: BrandData }) {
  const rows: [string, string][] = [
    ["Style", data.illustration.style], ["Treatment", data.illustration.treatment], ["Complexity", data.illustration.complexity],
  ];
  return (
    <div>
      <PanelHead n="08" title="Illustration" sub="The drawn layer of the brand, specified tightly enough to commission or generate against." />
      <div className="space-y-4">
        {rows.map(([k, v]) => (
          <div key={k} className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{k}</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IconographyPanel({ data }: { data: BrandData }) {
  return (
    <div>
      <PanelHead n="09" title="Iconography" sub="Stroke, corners, grid and weight — the small details that read as quality." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="hairline-panel bg-panel p-6">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Construction</p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink">{data.iconography.grid}</p>
        </div>
        <div className="hairline-panel bg-panel p-6">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Style</p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink">{data.iconography.style}</p>
          <p className="mt-2 text-[13px] text-ink-soft">Corners: {data.iconography.corners}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-2" aria-hidden>
        {["M4 20 20 4M20 20 4 4", "M4 12h16M12 4v16", "M6 18 18 6M6 6l12 12", "M4 16c4-8 12-8 16 0", "M12 3v18M3 12h18", "M5 19c0-8 14-8 14 0"].map((d, i) => (
          <div key={i} className="hairline-panel flex aspect-square items-center justify-center bg-panel">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d={d} stroke={data.colors.list[0].hex} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LayoutPanel({ data }: { data: BrandData }) {
  return (
    <div>
      <PanelHead n="10" title="Layout system" sub="Grid, spacing, margins — the invisible structure behind every surface." />
      <div className="grid gap-4 md:grid-cols-2">
        {([
          ["Grid", data.layout.grid], ["Spacing", data.layout.spacing],
          ["Margins", data.layout.margins], ["Columns", data.layout.columns],
        ] as const).map(([k, v]) => (
          <div key={k} className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{k}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="brand-grid-bg mt-6 h-40 border border-[color:var(--line)]" aria-hidden />
    </div>
  );
}

export function TokensPanel({ data }: { data: BrandData }) {
  const typo = data.typography;
  const typeVars = [
    ...typo.styles.map((s) => [`text-${s.name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`, `${s.sizePx}px`]),
    ["type-base", `${typo.hierarchy.baseSize}px`],
    ["type-scale", String(typo.hierarchy.scale)],
  ] as [string, string][];
  const asJson = JSON.stringify({ ...data.tokens, typography: { fonts: data.tokens.font, hierarchy: typo.hierarchy, styles: typo.styles.map((s) => ({ ...s, font: fontStack(styleFont(typo, s)) })) } }, null, 2);
  const asCss =
    ":root {\n" +
    Object.entries(data.tokens.color).map(([k, v]) => `  --${k.replace("/", "-")}: ${v};`).join("\n") +
    "\n" + Object.entries(data.tokens.font).map(([k, v]) => `  --${k.replace("/", "-")}: ${v};`).join("\n") +
    "\n" + typeVars.map(([k, v]) => `  --${k}: ${v};`).join("\n") +
    "\n" + Object.entries(data.tokens.spacing).map(([k, v]) => `  --${k.replace("/", "-")}: ${v};`).join("\n") +
    "\n" + Object.entries(data.tokens.radius).map(([k, v]) => `  --${k.replace("/", "-")}: ${v};`).join("\n") +
    "\n}";
  return (
    <div>
      <PanelHead n="11" title="Design tokens" sub="The structured values that power Figma variables, websites, components, templates and exports." />
      <div className="grid gap-6 lg:grid-cols-2">
        {([
          ["Colour", data.tokens.color],
          ["Typography", data.tokens.font],
          ["Spacing", data.tokens.spacing],
          ["Radius & shadow", { ...data.tokens.radius, ...data.tokens.shadow }],
        ] as const).map(([title, map]) => (
          <div key={title} className="hairline-panel bg-panel p-5">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{title}</p>
            <div className="mt-3 space-y-1.5">
              {Object.entries(map).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-[color:var(--line)] pb-1.5">
                  <code className="font-mono-tech text-[11px] text-ink">{k}</code>
                  <span className="flex items-center gap-2">
                    {/^#/.test(v) && <span className="inline-block h-3.5 w-3.5 border border-black/10" style={{ background: v }} />}
                    <code className="font-mono-tech text-[11px] text-ink-soft">{v}</code>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => download("tokens.json", asJson, "application/json")} className="btn-clip bg-ink px-5 py-2.5 text-[12px] font-semibold text-paper">
          <span className="btn-mask bg-brand-accent" aria-hidden />Export tokens.json
        </button>
        <button onClick={() => download("tokens.css", asCss, "text/css")} className="btn-clip border border-[color:var(--line-strong)] px-5 py-2.5 text-[12px] font-semibold text-ink">
          <span className="btn-mask bg-ink" aria-hidden />
          <span className="relative z-10 transition-colors duration-500 hover:text-paper">Export CSS variables</span>
        </button>
      </div>
    </div>
  );
}

export function ApplicationsPanel({ data }: { data: BrandData }) {
  return (
    <div>
      <PanelHead n="12" title="Applications" sub="Where the brand will live — specified as concrete contexts, not abstract wishes." />
      <div className="grid gap-px border border-[color:var(--line)] bg-[color:var(--line)] md:grid-cols-2">
        {data.applications.map((a, i) => {
          const [title, ...rest] = a.split("—");
          return (
            <div key={a} className="bg-panel p-6">
              <span className="font-mono-tech text-[10px] tracking-[0.2em] text-brand-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-semibold text-ink">{title.trim()}</p>
              {rest.length > 0 && <p className="mt-1 text-[13px] text-ink-soft">{rest.join("—").trim()}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LockPanel({ data, toggleLock }: { data: BrandData; toggleLock: (k: string) => void }) {
  const items = [
    { key: "logo", label: "Logo", desc: "The mark itself — locked means no AI or regeneration may touch it." },
    { key: "colour", label: "Primary Colour", desc: "Palette and tokens — locked keeps every dependent consistent." },
    { key: "typography", label: "Typography", desc: "Typeface choices across the hierarchy." },
  ];
  return (
    <div>
      <PanelHead n="13" title="Brand lock" sub="Lock approved elements. AI and generation tools must respect locked elements — this is a major trust feature, not a toggle decoration." />
      <div className="space-y-4">
        {items.map((item) => {
          const locked = data.locked.includes(item.key);
          return (
            <div key={item.key} className="flex flex-wrap items-center justify-between gap-4 hairline-panel bg-panel p-5">
              <div>
                <p className="font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-[13px] text-ink-soft">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleLock(item.key)}
                className={`relative h-7 w-14 transition-colors duration-300 ${locked ? "bg-ink" : "bg-[color:var(--line-strong)]"}`}
                aria-pressed={locked}
              >
                <span
                  className={`absolute top-1 h-5 w-5 bg-white transition-all duration-300 ${locked ? "left-8" : "left-1"}`}
                  style={{ transitionTimingFunction: "var(--ease-reveal)" }}
                />
              </button>
            </div>
          );
        })}
      </div>
      {data.locked.length > 0 && (
        <p className="mt-6 border border-ok/40 bg-ok/5 px-4 py-3 text-[13px] text-ok">
          {data.locked.length} element(s) locked. Editing is disabled for them in this studio, and AI refinement refuses to change them.
        </p>
      )}
    </div>
  );
}
