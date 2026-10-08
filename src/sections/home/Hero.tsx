import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const STAGES = [
  { key: "LOGO", caption: "It starts with what you have" },
  { key: "BRAND DNA", caption: "Essence, positioning, personality" },
  { key: "COLOUR", caption: "A palette with intent" },
  { key: "TYPE", caption: "A voice you can see" },
  { key: "GRAPHICS", caption: "A language of shape" },
  { key: "SYSTEM", caption: "Tokens, rules, structure" },
  { key: "GUIDELINES", caption: "A professional brand book" },
  { key: "FIGMA", caption: "Ready for product design" },
  { key: "EVERYWHERE", caption: "Consistent by default" },
] as const;

const STEP_MS = 2100;

/** The signature interactive transformation — a logo becoming a system. */
export function TransformationStage({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STAGES.length), STEP_MS);
    return () => clearInterval(t);
  }, []);

  const stage = STAGES[step];

  return (
    <div className={compact ? "" : "mx-auto w-full max-w-3xl"}>
      {/* Stage visual */}
      <div className="hairline-panel relative overflow-hidden bg-panel" style={{ minHeight: compact ? 220 : 300 }}>
        <div className="brand-grid-bg-fine absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex items-center justify-center p-8" style={{ minHeight: compact ? 220 : 300 }}>
          <StageVisual step={step} />
        </div>
        {/* stage readout */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-[color:var(--line)] bg-paper/80 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-brand-accent">
            {String(step + 1).padStart(2, "0")} / {stage.key}
          </span>
          <span className="hidden text-[11px] text-ink-faint sm:block">{stage.caption}</span>
        </div>
      </div>
      {/* Stage rail */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`font-mono-tech text-[10px] uppercase tracking-[0.14em] transition-colors ${
              i === step ? "text-brand-accent" : i < step ? "text-ink" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {s.key}
          </button>
        ))}
      </div>
    </div>
  );
}

function StageVisual({ step }: { step: number }) {
  const common = "w-full max-w-md transition-all duration-700";
  switch (step) {
    case 0: // LOGO
      return (
        <div className={`${common} flex justify-center`}>
          <div className="float-y flex h-28 w-28 items-center justify-center bg-ink text-paper">
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden>
              <rect x="2" y="2" width="12" height="12" fill="currentColor" />
              <rect x="18" y="2" width="12" height="12" fill="currentColor" opacity="0.4" />
              <rect x="2" y="18" width="12" height="12" fill="currentColor" opacity="0.4" />
              <rect x="18" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      );
    case 1: // BRAND DNA
      return (
        <div className={`${common} space-y-2`}>
          {[
            ["ESSENCE", "Considered quality, delivered calmly"],
            ["POSITIONING", "For people who notice the details"],
            ["PROMISE", "Every touchpoint, unmistakably yours"],
          ].map(([k, v], i) => (
            <div key={k} className="flex items-baseline gap-4 border-b border-[color:var(--line)] pb-2" style={{ animation: `tick-in .5s var(--ease-reveal) ${i * 0.15}s both` }}>
              <span className="w-28 shrink-0 font-mono-tech text-[10px] tracking-[0.16em] text-brand-accent">{k}</span>
              <span className="font-display text-lg text-ink">{v}</span>
            </div>
          ))}
        </div>
      );
    case 2: // COLOUR
      return (
        <div className={`${common} flex h-32`}>
          {["#0A2A4A", "#3D5A80", "#E54B32", "#E8E6E1", "#F7F6F2"].map((hex, i) => (
            <div
              key={hex}
              className="flex-1 transition-all duration-500 hover:flex-[1.6]"
              style={{ background: hex, animation: `tick-in .5s var(--ease-reveal) ${i * 0.1}s both`, transformOrigin: "bottom" }}
            />
          ))}
        </div>
      );
    case 3: // TYPE
      return (
        <div className={`${common} text-center`}>
          <p className="font-display text-6xl leading-none text-ink" style={{ animation: "tick-in .6s var(--ease-reveal) both" }}>Aa</p>
          <p className="mt-3 font-mono-tech text-[11px] tracking-[0.2em] text-ink-faint">FRAUNCES — DISPLAY / INTER — BODY</p>
          <p className="mt-1 text-sm text-ink-soft">Brand systems that scale gracefully</p>
        </div>
      );
    case 4: // GRAPHICS
      return (
        <div className={`${common} grid grid-cols-6 gap-1.5`}>
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square"
              style={{
                background: i % 7 === 0 ? "#E54B32" : i % 3 === 0 ? "#0A2A4A" : i % 3 === 1 ? "#3D5A80" : "#E8E6E1",
                opacity: 0.15 + ((i * 37) % 85) / 100,
                animation: `tick-in .4s var(--ease-reveal) ${i * 0.04}s both`,
              }}
            />
          ))}
        </div>
      );
    case 5: // SYSTEM
      return (
        <div className={`${common} grid grid-cols-4 gap-2`}>
          {["TOKENS", "SPACING", "RADIUS", "GRID", "TYPE", "COLOUR", "SHADOW", "BREAK"].map((t, i) => (
            <div key={t} className="hairline-panel bg-paper px-3 py-3 text-center" style={{ animation: `tick-in .45s var(--ease-reveal) ${i * 0.07}s both` }}>
              <span className="font-mono-tech text-[10px] tracking-[0.14em] text-ink-soft">{t}</span>
            </div>
          ))}
        </div>
      );
    case 6: // GUIDELINES
      return (
        <div className={`${common} mx-auto flex max-w-sm gap-3`}>
          {[0, 1].map((p) => (
            <div key={p} className="hairline-panel flex-1 bg-white p-4 shadow-[0_10px_30px_rgba(8,45,79,0.12)]" style={{ animation: `float-y 6s ease-in-out ${p * 0.8}s infinite` }}>
              <p className="font-mono-tech text-[8px] tracking-[0.18em] text-ink-faint">{p === 0 ? "01 — LOGO" : "02 — COLOUR"}</p>
              <div className="mt-3 h-1.5 w-3/4 bg-ink" />
              <div className="mt-2 h-1.5 w-1/2 bg-ink opacity-30" />
              <div className="mt-4 flex gap-1">
                {(p === 0 ? ["#0A2A4A", "#F7F6F2"] : ["#0A2A4A", "#3D5A80", "#E54B32", "#E8E6E1"]).map((c) => (
                  <div key={c} className="h-6 flex-1" style={{ background: c, border: "1px solid var(--line)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case 7: // FIGMA
      return (
        <div className={`${common} hairline-panel bg-[#1E1E1E] p-4`}>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              ["color/primary", "#0A2A4A"],
              ["color/accent", "#E54B32"],
              ["space/4", "24px"],
              ["radius/m", "6px"],
            ].map(([k, v], i) => (
              <div key={k} className="flex items-center justify-between rounded bg-[#2C2C2C] px-3 py-1.5" style={{ animation: `tick-in .4s var(--ease-reveal) ${i * 0.08}s both` }}>
                <span className="font-mono-tech text-[10px] text-[#9CDCFE]">{k}</span>
                <span className="font-mono-tech text-[10px] text-[#CE9178]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      );
    default: // EVERYWHERE
      return (
        <div className={`${common} grid grid-cols-3 gap-2`}>
          {["WEB", "SOCIAL", "PRINT", "DECK", "PACK", "APP"].map((t, i) => (
            <div key={t} className="hairline-panel flex aspect-[4/3] items-center justify-center bg-white" style={{ animation: `tick-in .4s var(--ease-reveal) ${i * 0.08}s both` }}>
              <span className="font-mono-tech text-[10px] tracking-[0.18em] text-ink-soft">{t}</span>
            </div>
          ))}
        </div>
      );
  }
}

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden pt-16">
      <div className="brand-grid-bg grid-pan absolute inset-0 opacity-70" aria-hidden />
      {/* vignette to keep text legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--paper)_30%,transparent_75%)]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 md:px-8 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="sec-marker" data-reveal>Brand System Platform</p>
            <h1
              className="mt-6 text-balance text-[2.6rem] leading-[1.04] md:text-[3.9rem]"
              data-reveal
              style={{ ["--i" as string]: 1 }}
            >
              Your logo is the beginning.
              <br />
              <span className="text-brand-accent">Your brand system</span> is what comes next.
            </h1>
            <p
              className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft"
              data-reveal
              style={{ ["--i" as string]: 2 }}
            >
              BrandKit360 turns your existing logo into a complete, editable brand system.
              Professional guidelines, a Figma-ready system, and consistency everywhere —
              built from five questions, not five meetings.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4" data-reveal style={{ ["--i" as string]: 3 }}>
              <button
                onClick={() => navigate("/build")}
                className="btn-clip breathe bg-brand-accent px-7 py-3.5 text-sm font-semibold tracking-wide text-white"
              >
                <span className="btn-mask bg-ink" aria-hidden />
                Build My Brand System
              </button>
              <a
                href="#how"
                className="btn-clip border border-[color:var(--line-strong)] px-7 py-3.5 text-sm font-semibold tracking-wide text-ink"
              >
                <span className="btn-mask bg-ink" aria-hidden />
                <span className="relative z-10 transition-colors duration-500 group-hover:text-paper">See How It Works</span>
                <span className="sr-only">See how it works</span>
              </a>
            </div>
            <p className="mt-8 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint" data-reveal style={{ ["--i" as string]: 4 }}>
              No account needed to explore — start with your logo.
            </p>
          </div>
          <div data-reveal style={{ ["--i" as string]: 2 }}>
            <TransformationStage compact />
          </div>
        </div>
      </div>
    </section>
  );
}
