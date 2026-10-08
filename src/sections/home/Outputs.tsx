/** §8+§9 — Figma-ready system & auto-generated Brand Guidelines. */
export function FigmaSection() {
  const vars = [
    ["color / primary", "#0A2A4A", true],
    ["color / secondary", "#3D5A80", true],
    ["color / accent", "#E54B32", true],
    ["color / background", "#F7F6F2", true],
    ["space / section", "96px", false],
    ["radius / card", "6px", false],
  ] as const;
  return (
    <section id="figma" className="hairline-t">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        <div>
          <p className="sec-marker" data-reveal>08 / Figma-ready</p>
          <h2 className="mt-5 text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
            Structured data in. Real variables out.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
            We never place screenshots into a Figma file. Your system exports as colour
            variables, typography styles, spacing tokens, grids and components — the
            architecture your designers actually work with. Never claim an integration
            that isn't real: this output is generated from the same structured data
            that powers everything else.
          </p>
          <ul className="mt-7 space-y-2.5" data-reveal style={{ ["--i" as string]: 3 }}>
            {["Colour & spacing variables", "Typography text styles", "Grids and component specs", "Design tokens as JSON / CSS"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-ink">
                <span className="inline-block h-1.5 w-1.5 bg-brand-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        {/* Figma variables panel mock */}
        <div className="hairline-panel bg-[#1E1E1E] p-5 shadow-[0_24px_60px_rgba(8,45,79,0.25)]" data-reveal style={{ ["--i" as string]: 2 }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-mono-tech text-[11px] text-[#9CDCFE]">BrandKit360 → yourbrand.fig</span>
            <span className="font-mono-tech text-[10px] text-white/40">VARIABLES</span>
          </div>
          <div className="mt-4 space-y-2">
            {vars.map(([k, v, isColor], i) => (
              <div key={k} className="flex items-center justify-between rounded-sm bg-[#2C2C2C] px-3.5 py-2.5" data-reveal style={{ ["--i" as string]: i }}>
                <span className="font-mono-tech text-[11px] text-[#D4D4D4]">{k}</span>
                <span className="flex items-center gap-2">
                  {isColor && <span className="inline-block h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: v as string }} />}
                  <span className="font-mono-tech text-[11px] text-[#CE9178]">{v}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono-tech text-[10px] leading-relaxed text-white/35">
            tokens.json → Figma Variables. Edit the token in BrandKit360, the variable updates.
          </p>
        </div>
      </div>
    </section>
  );
}

export function GuidelinesSection() {
  const pages = [
    ["01", "Brand Overview", "A concise visual summary of the whole system"],
    ["02", "Logo & Usage", "Clear space, minimum size, correct & incorrect use"],
    ["03", "Colour", "Codes, roles, combinations and accessibility contrast"],
    ["04", "Typography", "Typefaces, hierarchy, rules of setting"],
    ["05", "Voice", "Tone, vocabulary, examples, dos & don'ts"],
  ];
  return (
    <section id="guidelines" className="hairline-t bg-paper-2/60">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        {/* book spread mock */}
        <div className="relative" data-reveal>
          <div className="grid grid-cols-2 gap-1 shadow-[0_32px_80px_rgba(8,45,79,0.22)]">
            {[0, 1].map((p) => (
              <div key={p} className="aspect-[3/4] bg-white p-6">
                <p className="font-mono-tech text-[9px] tracking-[0.2em] text-ink-faint">{p === 0 ? "BRANDKIT360 GUIDELINES" : "03 — COLOUR"}</p>
                {p === 0 ? (
                  <>
                    <p className="mt-6 font-display text-2xl leading-tight text-ink">Northpine Co. Brand Guidelines</p>
                    <div className="mt-6 flex h-24 gap-1">
                      {["#0A2A4A", "#3D5A80", "#E54B32", "#E8E6E1"].map((c) => (
                        <div key={c} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="mt-6 h-1.5 w-4/5 bg-ink" />
                    <div className="mt-2 h-1.5 w-3/5 bg-ink opacity-30" />
                  </>
                ) : (
                  <>
                    <p className="mt-6 font-display text-xl text-ink">Colour</p>
                    {[
                      ["Primary", "#0A2A4A", "AAA"],
                      ["Accent", "#E54B32", "AA"],
                    ].map(([n, c, rating]) => (
                      <div key={n} className="mt-4 flex items-center gap-3">
                        <span className="h-8 w-8 border border-[color:var(--line)]" style={{ background: c as string }} />
                        <div>
                          <p className="text-[11px] font-semibold text-ink">{n}</p>
                          <p className="font-mono-tech text-[9px] text-ink-faint">{c} — {rating}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 border-t border-[color:var(--line)] pt-3">
                      <p className="text-[10px] leading-relaxed text-ink-soft">Contrast checked against WCAG. Combinations failing AA are marked as decorative-only.</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Auto-generated — never assembled by hand
          </span>
        </div>
        <div>
          <p className="sec-marker" data-reveal>09 / Brand guidelines</p>
          <h2 className="mt-5 text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
            A premium brand book, generated from the system — not pasted into a doc.
          </h2>
          <div className="mt-8 space-y-4">
            {pages.map(([n, t, d], i) => (
              <div key={n} className="flex items-baseline gap-5 border-b border-[color:var(--line)] pb-4" data-reveal style={{ ["--i" as string]: i }}>
                <span className="font-mono-tech text-[11px] tracking-[0.18em] text-brand-accent">{n}</span>
                <div>
                  <p className="font-semibold text-ink">{t}</p>
                  <p className="text-[13px] text-ink-soft">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-7 text-sm leading-relaxed text-ink-soft" data-reveal>
            Export as high-resolution PDF or publish as living web guidelines.
            When the system changes, the document is regenerated — the PDF is an output,
            never the source of truth.
          </p>
        </div>
      </div>
    </section>
  );
}
