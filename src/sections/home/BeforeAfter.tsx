import { useCallback, useRef, useState } from "react";

/** §4 — Before / After: draggable compare slider. */
export default function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(58);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(8, Math.min(92, pct)));
  }, []);

  return (
    <section className="hairline-t bg-paper-2/60">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <p className="sec-marker" data-reveal>04 / Before — After</p>
        <h2 className="mt-5 max-w-2xl text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
          Drag the line. Watch a logo become an entire brand.
        </h2>

        <div
          ref={ref}
          className="relative mt-12 select-none overflow-hidden border border-[color:var(--line)] bg-panel"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            update(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && update(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
          data-reveal
          style={{ ["--i" as string]: 2 }}
        >
          {/* AFTER (base layer) */}
          <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4 md:p-10">
            {[
              { t: "BUSINESS CARD", bg: "#FFFFFF", fg: "#0A2A4A", extra: true },
              { t: "WEBSITE HERO", bg: "#0A2A4A", fg: "#F7F6F2", extra: true },
              { t: "SOCIAL POST", bg: "#E54B32", fg: "#FFFFFF", extra: false },
              { t: "PRESENTATION", bg: "#F7F6F2", fg: "#0A2A4A", extra: true },
              { t: "PACKAGING", bg: "#3D5A80", fg: "#F7F6F2", extra: true },
              { t: "SIGNAGE", bg: "#0A2A4A", fg: "#E54B32", extra: false },
              { t: "BRAND BOOK", bg: "#FFFFFF", fg: "#0A2A4A", extra: true },
              { t: "APP ICON", bg: "#E54B32", fg: "#FFFFFF", extra: false },
            ].map((m) => (
              <div key={m.t} className="aspect-[4/3] p-3" style={{ background: m.bg, border: "1px solid var(--line)" }}>
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5" style={{ background: m.fg === "#FFFFFF" ? "#0A2A4A" : m.fg, opacity: m.extra ? 1 : 0.9 }} />
                    <span className="inline-block h-1.5 w-8" style={{ background: m.fg, opacity: 0.5 }} />
                  </div>
                  <div>
                    <div className="h-1.5 w-3/4" style={{ background: m.fg }} />
                    <div className="mt-1 h-1 w-1/2" style={{ background: m.fg, opacity: 0.4 }} />
                  </div>
                  <span className="font-mono-tech text-[7px] tracking-[0.16em]" style={{ color: m.fg, opacity: 0.7 }}>{m.t}</span>
                </div>
              </div>
            ))}
          </div>

          {/* BEFORE overlay (clipped) */}
          <div className="absolute inset-0 flex items-center justify-center bg-paper" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <div className="brand-grid-bg-fine absolute inset-0 opacity-50" aria-hidden />
            <div className="relative text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center bg-ink text-paper">
                <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <rect x="2" y="2" width="12" height="12" fill="currentColor" />
                  <rect x="18" y="2" width="12" height="12" fill="currentColor" opacity="0.4" />
                  <rect x="2" y="18" width="12" height="12" fill="currentColor" opacity="0.4" />
                  <rect x="18" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </div>
              <p className="mt-5 font-mono-tech text-[11px] uppercase tracking-[0.22em] text-ink-faint">Before — one logo file</p>
            </div>
          </div>

          {/* divider */}
          <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-brand-accent" />
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-11 w-11 cursor-ew-resize items-center justify-center rounded-full bg-brand-accent text-white shadow-lg">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
                  <path d="M5 1 1 6l4 5M13 1l4 5-4 5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
            </div>
          </div>

          <span className="absolute bottom-3 right-4 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">After — a complete brand ecosystem</span>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft" data-reveal>
          Logo, colour, typography, graphics, templates, website, social, packaging,
          presentations, guidelines — one system, generated from your answers, editable forever.
        </p>
      </div>
    </section>
  );
}
