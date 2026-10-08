/** §3 — How BrandKit360 works. */
export default function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Upload your logo",
      body: "SVG, PNG or JPG. We display it prominently, detect its colours and visual properties — and clearly label what we detected versus what we suggest. Assumptions are never presented as facts.",
    },
    {
      n: "02",
      title: "Answer five questions",
      body: "What you do, who it's for, how it should feel, where it will live, and which brands you admire. Visual cards, not design jargon. About two minutes, honestly.",
    },
    {
      n: "03",
      title: "Review, edit, own it",
      body: "Get your Brand DNA, then the complete system — colour, typography, graphic language, photography, voice, tokens. Everything is editable. Lock what you approve. Change once, update everywhere.",
    },
  ];
  return (
    <section id="how" className="hairline-t">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="sec-marker" data-reveal>03 / How it works</p>
            <h2 className="mt-5 max-w-xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
              Extremely simple on the surface. Sophisticated underneath.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
            The experience feels effortless even though the technology isn't. That gap
            between effort and outcome is the entire point.
          </p>
        </div>
        <div className="mt-14 grid gap-px border border-[color:var(--line)] bg-[color:var(--line)] md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="bg-panel p-8" data-reveal style={{ ["--i" as string]: i }}>
              <span className="font-mono-tech text-[11px] tracking-[0.22em] text-brand-accent">{s.n}</span>
              <h3 className="mt-4 text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
