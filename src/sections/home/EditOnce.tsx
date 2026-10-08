import { useState } from "react";

/** §6+§7 — Editable brand system + “Change once. Update everywhere.” (live demo). */
export default function EditOnce() {
  const [primary, setPrimary] = useState("#0A2A4A");
  const [accent, setAccent] = useState("#E54B32");
  const [editMode, setEditMode] = useState(false);
  const [regenCount, setRegenCount] = useState(0);

  const alternatives = [
    ["#0A2A4A", "#E54B32"],
    ["#1E5631", "#F2A93B"],
    ["#5B2A4A", "#EFA13C"],
    ["#0F4C5C", "#E8A33D"],
  ];
  const [p, a] = alternatives[regenCount % alternatives.length];

  return (
    <section className="hairline-t bg-paper-2/60">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <p className="sec-marker" data-reveal>06+07 / Editable system</p>
        <h2 className="mt-5 max-w-2xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
          Change once. <span className="text-brand-accent">Update everywhere.</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
          Everything important is editable. Edit a token and dependent components,
          templates and guideline references update — never randomly, never silently.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Control panel */}
          <div className="hairline-panel self-start bg-panel p-6" data-reveal style={{ ["--i" as string]: 2 }}>
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Design token</span>
              <span className="font-mono-tech text-[10px] tracking-[0.14em] text-ok">● SYNCED</span>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-ink">Primary Colour</label>
                {editMode && (
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-brand-accent">editing</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className="inline-block h-10 w-10 border border-[color:var(--line)] transition-colors duration-500"
                  style={{ background: primary }}
                />
                {editMode ? (
                  <input
                    autoFocus
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    onBlur={() => setEditMode(false)}
                    className="w-28 border border-[color:var(--line-strong)] bg-paper px-2 py-1.5 font-mono-tech text-sm outline-none focus:border-brand-accent"
                  />
                ) : (
                  <code className="font-mono-tech text-sm text-ink">{primary.toUpperCase()}</code>
                )}
              </div>
              {/* editing controls (§14) */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setEditMode(false)} className="border border-[color:var(--line-strong)] px-3 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper">Keep</button>
                <button onClick={() => setEditMode((v) => !v)} className="border border-[color:var(--line-strong)] px-3 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper">Edit</button>
                <button
                  onClick={() => { setRegenCount((c) => c + 1); setPrimary(p); setAccent(a); }}
                  className="border border-[color:var(--line-strong)] px-3 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Regenerate
                </button>
                <button className="border border-brand-accent px-3 py-1.5 text-[11px] font-semibold text-brand-accent transition-colors hover:bg-brand-accent hover:text-white">
                  Ask AI
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
                Also editable: accent, neutrals, typography, voice. Locked elements
                can't be changed by AI or regeneration — a major trust feature.
              </p>
            </div>
          </div>

          {/* Live previews */}
          <div className="grid gap-4 sm:grid-cols-2" data-reveal style={{ ["--i" as string]: 3 }}>
            {/* business card */}
            <div className="aspect-[16/10] p-5 shadow-[0_12px_32px_rgba(8,45,79,0.14)] transition-colors duration-500" style={{ background: primary }}>
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3" style={{ background: accent }} />
                  <span className="text-[11px] font-semibold tracking-wide" style={{ color: "#F7F6F2" }}>NORTHPINE CO.</span>
                </div>
                <div>
                  <div className="h-2 w-2/3" style={{ background: "#F7F6F2" }} />
                  <div className="mt-1.5 h-1.5 w-2/5" style={{ background: accent }} />
                </div>
                <span className="font-mono-tech text-[8px] tracking-[0.18em]" style={{ color: "#F7F6F2", opacity: 0.6 }}>BUSINESS CARD</span>
              </div>
            </div>
            {/* social post */}
            <div className="aspect-[16/10] p-5 shadow-[0_12px_32px_rgba(8,45,79,0.14)] transition-colors duration-500" style={{ background: accent }}>
              <div className="flex h-full flex-col justify-between">
                <span className="font-display text-xl leading-tight text-white">New season, same standard.</span>
                <div className="flex items-center justify-between">
                  <span className="inline-block h-2 w-16 bg-white opacity-80" />
                  <span className="font-mono-tech text-[8px] tracking-[0.18em] text-white opacity-70">SOCIAL POST</span>
                </div>
              </div>
            </div>
            {/* web hero */}
            <div className="aspect-[16/10] border border-[color:var(--line)] bg-white p-5 shadow-[0_12px_32px_rgba(8,45,79,0.1)] sm:col-span-2">
              <div className="flex h-full items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="h-2.5 w-4/5 transition-colors duration-500" style={{ background: primary }} />
                  <div className="mt-2 h-2.5 w-3/5 transition-colors duration-500" style={{ background: primary, opacity: 0.55 }} />
                  <div className="mt-4 inline-block px-4 py-2 text-[11px] font-semibold text-white transition-colors duration-500" style={{ background: accent }}>
                    Get started
                  </div>
                </div>
                <div className="hidden h-full w-1/3 transition-colors duration-500 sm:block" style={{ background: primary, opacity: 0.12 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
