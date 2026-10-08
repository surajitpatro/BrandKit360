/** §10 — Brand Portal. §11 — Optional AI Studio. */
export function PortalSection() {
  return (
    <section id="portal" className="hairline-t">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        <div>
          <p className="sec-marker" data-reveal>10 / Brand portal</p>
          <h2 className="mt-5 text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
            One link your whole team can trust.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
            Publish a shareable Brand Portal — the living source of truth for your
            brand. Guidelines, logos, colours, downloads and approved assets,
            always current because they come straight from the system.
          </p>
          <div className="mt-7 inline-flex items-center gap-3 border border-[color:var(--line-strong)] bg-panel px-4 py-2.5" data-reveal style={{ ["--i" as string]: 3 }}>
            <span className="h-2 w-2 rounded-full bg-ok" />
            <code className="font-mono-tech text-[13px] text-ink">yourbrand.brandkit360.com</code>
          </div>
          <ul className="mt-7 space-y-2.5" data-reveal style={{ ["--i" as string]: 4 }}>
            {["Always in sync with the system", "Access-controlled for your team and partners", "Downloads with usage context attached"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-ink">
                <span className="inline-block h-1.5 w-1.5 bg-brand-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        {/* portal browser mock */}
        <div className="hairline-panel overflow-hidden bg-panel shadow-[0_24px_60px_rgba(8,45,79,0.18)]" data-reveal style={{ ["--i" as string]: 2 }}>
          <div className="flex items-center gap-2 border-b border-[color:var(--line)] bg-paper px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
            <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
            <span className="h-2 w-2 rounded-full bg-[#28C840]" />
            <span className="ml-3 flex-1 rounded-sm bg-white px-3 py-1 font-mono-tech text-[10px] text-ink-faint">
              portal.brandkit360.com/northpine
            </span>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[color:var(--line)] p-0">
            {[
              ["LOGO", "#0A2A4A"],
              ["COLOUR", "#E54B32"],
              ["TYPE", "#3D5A80"],
              ["VOICE", "#0A2A4A"],
              ["ASSETS", "#3D5A80"],
              ["GUIDELINES", "#E54B32"],
            ].map(([t, c], i) => (
              <div key={t} className="group bg-panel p-5 transition-colors hover:bg-paper" data-reveal style={{ ["--i" as string]: i }}>
                <div className="flex h-16 items-center justify-center" style={{ background: `${c}14` }}>
                  <span className="inline-block h-6 w-6" style={{ background: c }} />
                </div>
                <p className="mt-3 font-mono-tech text-[9px] tracking-[0.18em] text-ink-faint group-hover:text-brand-accent">{t}</p>
                <div className="mt-2 h-1 w-2/3 bg-ink opacity-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const AI_MODES = [
  { k: "CREATE", d: "Social posts, ads, presentations, hero sections — from your system, not from scratch." },
  { k: "WRITE", d: "Headlines, captions, CTAs and website copy in your verified voice." },
  { k: "REFINE", d: "“Make this more premium.” The system adjusts; your locked elements stay untouched." },
  { k: "ADAPT", d: "Instagram post → story. Poster → banner. Desktop → mobile. Same brand." },
  { k: "CHECK", d: "Upload creative; get it analysed against colour, type, logo usage, spacing, tone." },
];

export function AiSection() {
  return (
    <section id="ai" className="hairline-t bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="sec-marker !text-paper/40" data-reveal>11 / AI studio — optional</p>
            <h2 className="mt-5 max-w-2xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
              AI helps you move faster. <span className="text-brand-accent">Your brand remains yours.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-paper/60" data-reveal style={{ ["--i" as string]: 2 }}>
            The core product works completely without AI. AI Studio is an optional
            layer, available on System Pro — and it uses your structured brand system
            as context, never replacing it.
          </p>
        </div>
        <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-5">
          {AI_MODES.map((m, i) => (
            <div key={m.k} className="group bg-ink p-6 transition-colors duration-300 hover:bg-[#0D3357]" data-reveal style={{ ["--i" as string]: i }}>
              <span className="font-mono-tech text-[11px] tracking-[0.22em] text-brand-accent">{m.k}</span>
              <p className="mt-4 text-[13px] leading-relaxed text-paper/70">{m.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 font-mono-tech text-[11px] uppercase tracking-[0.2em] text-paper/40" data-reveal>
          AI never silently changes a locked brand element. That's a rule, not a feature.
        </p>
      </div>
    </section>
  );
}
