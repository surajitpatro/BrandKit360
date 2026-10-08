/**
 * Build wizard — step 03: visual direction (§10).
 * Colour direction (from logo / curated families / fine-tuned per role)
 * and typography direction (curated pairs or a hand-picked custom pairing).
 * Everything here only writes WizardAnswers — the generator turns it into
 * the BrandData source of truth in step 04/05.
 */
import { useEffect, useMemo } from "react";
import type { WizardAnswers } from "@/lib/generator";
import { hashString } from "@/lib/generator";
import { PALETTE_FAMILIES, familyById } from "@/lib/palettes";
import { TYPE_PAIRS } from "@/lib/typePairs";
import { logoPalette, ROLE_ORDER } from "@/lib/logoPalette";
import type { BrandColor } from "@contracts/brand";
import { fontById, toFontRef, ensureFontsForRefs } from "@/lib/fontLibrary";
import { FontPicker } from "@/components/FontPicker";

type SetAnswers = React.Dispatch<React.SetStateAction<WizardAnswers>>;

export function VisualDirectionStep({
  answers,
  setAnswers,
  brandName,
  detected,
  onBack,
  onNext,
}: {
  answers: WizardAnswers;
  setAnswers: SetAnswers;
  brandName: string;
  detected: string[];
  onBack: () => void;
  onNext: () => void;
}) {
  const hasLogoColours = detected.length >= 2;
  const mode: "logo" | "curated" = hasLogoColours ? (answers.colorMode ?? "logo") : "curated";

  // ---- suggested picks (same affinity scoring as the generator) ----
  const suggestedFamilyId = useMemo(() => {
    if (answers.paletteFamilyId) return answers.paletteFamilyId;
    let best = PALETTE_FAMILIES[0];
    let bestScore = -1;
    for (const f of PALETTE_FAMILIES) {
      const score = f.affinities.filter((t) => answers.personality.includes(t)).length;
      const tiebreak = score === bestScore && hashString(brandName + f.id) % 2 === 0;
      if (score > bestScore || tiebreak) {
        best = f;
        bestScore = score;
      }
    }
    return best.id;
  }, [answers.paletteFamilyId, answers.personality, brandName]);

  const suggestedPairId = useMemo(() => {
    if (answers.typePairId) return answers.typePairId;
    let best = TYPE_PAIRS[0];
    let bestScore = -1;
    for (const t of TYPE_PAIRS) {
      const score = t.affinities.filter((x) => answers.personality.includes(x)).length;
      if (score > bestScore) {
        best = t;
        bestScore = score;
      }
    }
    return best.id;
  }, [answers.typePairId, answers.personality]);

  // ---- base palette for the fine-tune row ----
  const baseColors: BrandColor[] = useMemo(
    () =>
      mode === "logo" && hasLogoColours
        ? logoPalette(detected)
        : familyById(suggestedFamilyId).colors.map((col, i) => ({ ...col, role: ROLE_ORDER[i] })),
    [mode, hasLogoColours, detected, suggestedFamilyId],
  );
  const effectiveColors = baseColors.map((c) =>
    answers.customColors?.[c.role] ? { ...c, hex: answers.customColors[c.role] } : c,
  );

  const pickMode = (m: "logo" | "curated") =>
    setAnswers((a) => ({ ...a, colorMode: m, ...(m === "curated" ? { paletteFamilyId: suggestedFamilyId } : {}) }));

  const pickFamily = (id: string) =>
    setAnswers((a) => ({ ...a, colorMode: "curated", paletteFamilyId: id, customColors: undefined }));

  const setRoleColour = (role: BrandColor["role"], hex: string) =>
    setAnswers((a) => ({ ...a, customColors: { ...a.customColors, [role]: hex } }));

  const clearRoleColour = (role: BrandColor["role"]) =>
    setAnswers((a) => {
      const next = { ...a.customColors };
      delete next[role];
      return { ...a, customColors: Object.keys(next).length ? next : undefined };
    });

  const pickPair = (id: string) =>
    setAnswers((a) => ({ ...a, typePairId: id, customType: undefined }));

  const previewRefs = useMemo(
    () =>
      TYPE_PAIRS.map((t) => ({
        heading: fontById(t.headingId),
        body: fontById(t.bodyId),
      })),
    [],
  );
  useEffect(() => {
    ensureFontsForRefs(
      previewRefs.flatMap((p) => [p.heading ? toFontRef(p.heading) : null, p.body ? toFontRef(p.body) : null]),
    );
  }, [previewRefs]);

  return (
    <div>
      <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">03</p>
      <h1 className="mt-2 text-3xl md:text-4xl">Choose your visual direction</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Colour and typography do most of the talking. Pick a direction — every choice stays editable forever after generation.
      </p>

      {/* ---------- colour direction ---------- */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Colour direction</h2>

        {hasLogoColours && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => pickMode("logo")}
              className={`hairline-panel p-5 text-left transition-colors ${mode === "logo" ? "border-ink bg-panel" : "bg-panel opacity-70 hover:opacity-100"}`}
            >
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Option A</p>
              <p className="mt-1.5 font-display text-lg text-ink">Build from my logo colours</p>
              <div className="mt-3 flex h-6 gap-1">
                {detected.map((hex) => (
                  <span key={hex} className="flex-1" style={{ background: hex }} />
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                Your detected colours, organised into a professional role system.
              </p>
            </button>
            <button
              onClick={() => pickMode("curated")}
              className={`hairline-panel p-5 text-left transition-colors ${mode === "curated" ? "border-ink bg-panel" : "bg-panel opacity-70 hover:opacity-100"}`}
            >
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Option B</p>
              <p className="mt-1.5 font-display text-lg text-ink">Curated palette families</p>
              <div className="mt-3 flex h-6 gap-1">
                {familyById(suggestedFamilyId).colors.slice(0, 6).map((c) => (
                  <span key={c.name} className="flex-1" style={{ background: c.hex }} />
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                Professionally balanced systems matched to your personality picks.
              </p>
            </button>
          </div>
        )}

        {mode === "curated" && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {PALETTE_FAMILIES.map((f) => {
              const matches = f.affinities.filter((t) => answers.personality.includes(t)).length;
              const selected = f.id === suggestedFamilyId;
              return (
                <button
                  key={f.id}
                  onClick={() => pickFamily(f.id)}
                  className={`hairline-panel bg-panel p-5 text-left transition-colors ${selected ? "border-ink" : "opacity-75 hover:opacity-100"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-[15px] text-ink">{f.label}</p>
                    {selected && (
                      <span className="shrink-0 bg-ink px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-paper">
                        {answers.paletteFamilyId ? "Selected" : "Suggested"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex h-7 gap-1">
                    {f.colors.map((c) => (
                      <span key={c.name} className="flex-1" style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                    ))}
                  </div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft">{f.rationale}</p>
                  {matches > 0 && (
                    <p className="mt-1.5 font-mono-tech text-[10px] tracking-[0.12em] text-brand-accent">
                      Matches {matches} of your chosen traits
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* fine-tune per role */}
        <div className="hairline-panel mt-5 bg-panel p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Fine-tune — override any role
            </p>
            {answers.customColors && (
              <button
                onClick={() => setAnswers((a) => ({ ...a, customColors: undefined }))}
                className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-brand-accent"
              >
                Reset all overrides
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {effectiveColors.map((c) => {
              const overridden = !!answers.customColors?.[c.role];
              return (
                <div key={c.role} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => setRoleColour(c.role, e.target.value)}
                    className="h-9 w-11 shrink-0 cursor-pointer border border-[color:var(--line-strong)] bg-transparent p-0.5"
                    aria-label={`${c.role} colour`}
                  />
                  <div className="min-w-0">
                    <p className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink">
                      {c.role}
                      {overridden && <span className="ml-1.5 text-brand-accent">· custom</span>}
                    </p>
                    <p className="truncate text-[11px] text-ink-faint">
                      {c.name} — {c.hex.toUpperCase()}
                    </p>
                  </div>
                  {overridden && (
                    <button
                      onClick={() => clearRoleColour(c.role)}
                      className="ml-auto font-mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-faint hover:text-ink"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- typography direction ---------- */}
      <div className="mt-12">
        <h2 className="font-display text-xl text-ink">Typography direction</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {TYPE_PAIRS.map((t, i) => {
            const selected = t.id === suggestedPairId && !answers.customType;
            const h = previewRefs[i].heading;
            const b = previewRefs[i].body;
            return (
              <button
                key={t.id}
                onClick={() => pickPair(t.id)}
                className={`hairline-panel bg-panel p-5 text-left transition-colors ${selected ? "border-ink" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-[15px] text-ink">{t.label}</p>
                  {selected && (
                    <span className="shrink-0 bg-ink px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-paper">
                      {answers.typePairId ? "Selected" : "Suggested"}
                    </span>
                  )}
                </div>
                <div className="mt-3 border-y border-[color:var(--line)] py-3">
                  <p
                    className="text-[22px] leading-snug text-ink"
                    style={{ fontFamily: h ? `'${h.family}', serif` : undefined }}
                  >
                    {brandName || "Your Brand"} — considered quality.
                  </p>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed text-ink-soft"
                    style={{ fontFamily: b ? `'${b.family}', sans-serif` : undefined }}
                  >
                    Body text sets the voice of every page — calm, credible, and easy to read at any length.
                  </p>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft">{t.note}</p>
              </button>
            );
          })}
        </div>

        {/* custom pairing */}
        <div className="hairline-panel mt-5 bg-panel p-5">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Or hand-pick from the full font library
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {(["heading", "body", "mono"] as const).map((slot) => {
              const currentId =
                answers.customType?.[`${slot}Id` as "headingId" | "bodyId" | "monoId"] ??
                (slot === "heading"
                  ? TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.headingId
                  : slot === "body"
                  ? TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.bodyId
                  : TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.monoId) ??
                "inter";
              const entry = fontById(currentId);
              return (
                <FontPicker
                  key={slot}
                  bestFor={slot}
                  personality={answers.personality}
                  value={entry ? toFontRef(entry) : toFontRef(fontById("inter")!)}
                  onChange={(_ref, e) => {
                    const base = answers.customType ?? {
                      headingId: TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.headingId ?? "inter",
                      bodyId: TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.bodyId ?? "inter",
                      monoId: TYPE_PAIRS.find((t) => t.id === suggestedPairId)?.monoId ?? "space-mono",
                    };
                    setAnswers((a) => ({
                      ...a,
                      typePairId: undefined,
                      customType: { ...base, [`${slot}Id`]: e.id },
                    }));
                  }}
                />
              );
            })}
          </div>
          {answers.customType && (
            <p className="mt-3 font-mono-tech text-[10px] tracking-[0.12em] text-brand-accent">
              Custom pairing selected — curated cards above are deselected.
            </p>
          )}
        </div>
      </div>

      {/* nav */}
      <div className="mt-12 flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="btn-clip bg-ink px-8 py-3.5 text-sm font-semibold tracking-wide text-paper"
        >
          <span className="btn-mask bg-brand-accent" aria-hidden />
          Continue
        </button>
      </div>
    </div>
  );
}
