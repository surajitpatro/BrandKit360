/** §2 — Logo-to-System transformation + the philosophy band. */
export function TransformationSection() {
  const nodes = [
    { label: "LOGO", sub: "what you have", accent: false },
    { label: "BRAND DNA", sub: "who you are", accent: true },
    { label: "SYSTEM", sub: "structure & tokens", accent: false },
    { label: "GUIDELINES", sub: "the brand book", accent: false },
    { label: "FIGMA + PORTAL", sub: "where it lives", accent: true },
  ];
  return (
    <section id="transform" className="hairline-t bg-paper-2/60">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <p className="sec-marker" data-reveal>02 / The transformation</p>
        <h2 className="mt-5 max-w-2xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
          From a single file to a living system — the distance most brands never cross.
        </h2>
        <div className="mt-14 grid gap-px overflow-hidden border border-[color:var(--line)] bg-[color:var(--line)] md:grid-cols-5" data-reveal style={{ ["--i" as string]: 2 }}>
          {nodes.map((n, i) => (
            <div key={n.label} className="group relative bg-panel p-6 transition-colors duration-500 hover:bg-paper">
              <span className="font-mono-tech text-[10px] tracking-[0.2em] text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <p className={`mt-4 font-display text-xl ${n.accent ? "text-brand-accent" : "text-ink"}`}>{n.label}</p>
              <p className="mt-1 text-[13px] text-ink-soft">{n.sub}</p>
              {i < nodes.length - 1 && (
                <svg className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="var(--brand-accent)" strokeWidth="1.5" className="pipeline-flow" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3" data-reveal style={{ ["--i" as string]: 3 }}>
          {[
            ["Most businesses have a logo.", "Very few have a properly structured brand system."],
            ["BrandKit360 solves the gap.", "Between “I have a logo” and “I have a complete brand.”"],
            ["The system is the source of truth.", "The PDF guidelines are only one of its outputs."],
          ].map(([lead, rest]) => (
            <div key={lead} className="border-l-2 border-brand-accent pl-5">
              <p className="font-semibold text-ink">{lead}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{rest}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PhilosophyBand() {
  return (
    <section id="philosophy" className="hairline-t">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <blockquote className="mx-auto max-w-3xl text-center" data-reveal>
          <p className="font-display text-2xl leading-snug text-ink md:text-[2.1rem]">
            “The brand system is the source of truth.
            <span className="text-brand-accent"> The guidelines are just an output.”</span>
          </p>
          <footer className="mt-5 font-mono-tech text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            The BrandKit360 principle
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
