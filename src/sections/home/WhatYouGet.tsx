/** §5 — What you get: the sixteen parts of the system. */
const ITEMS = [
  ["Brand DNA", "Essence, positioning, promise, personality, tone"],
  ["Logo System", "Clear space, minimum size, usage rules"],
  ["Colour System", "Primary, secondary, accent, neutrals + accessibility"],
  ["Typography", "Typefaces, weights, hierarchy, spacing"],
  ["Graphic Language", "Shapes, patterns, devices, image treatment"],
  ["Photography", "Light, composition, tone, what to avoid"],
  ["Illustration", "Style, stroke, complexity"],
  ["Iconography", "Grid, weight, corner treatment"],
  ["Layout", "Grid, spacing, margins, responsiveness"],
  ["Brand Voice", "Tone, vocabulary, dos & don'ts, examples"],
  ["Design Tokens", "Colour, type, spacing, radius, shadow"],
  ["Components", "Buttons, cards, forms built from tokens"],
  ["Applications", "Where the brand lives, specified"],
  ["Guidelines", "The professional brand book — auto-generated"],
  ["Assets", "Downloads in SVG, PNG, JPG, JSON, CSS"],
  ["Version History", "Save, compare, restore every iteration"],
];

export default function WhatYouGet() {
  return (
    <section id="system" className="hairline-t">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="sec-marker" data-reveal>05 / What you get</p>
            <h2 className="mt-5 max-w-xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
              Everything your brand needs. In one system.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
            Not a mood board. A structured, editable system with sixteen connected
            parts — the same architecture serious brands run on.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-px border border-[color:var(--line)] bg-[color:var(--line)] md:grid-cols-4">
          {ITEMS.map(([t, d], i) => (
            <div
              key={t}
              className="group bg-panel p-5 transition-colors duration-300 hover:bg-ink hover:text-paper"
              data-reveal
              style={{ ["--i" as string]: i % 4 }}
            >
              <span className="font-mono-tech text-[9px] tracking-[0.18em] text-ink-faint group-hover:text-paper/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[1.05rem] font-semibold">{t}</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft group-hover:text-paper/70">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
