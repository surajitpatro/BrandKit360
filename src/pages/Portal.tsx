import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import Logo from "@/components/Logo";
import { colorCodes } from "@/lib/colorUtils";
import { ensureFontsForRefs, fontStack, normalizeTypography, styleFont } from "@/lib/fontLibrary";

/**
 * Public Brand Portal (§20) — the living source of truth, readable by anyone
 * with the link while the owner has published it.
 */
export default function Portal() {
  const { brandId } = useParams<{ brandId: string }>();
  const id = Number(brandId);
  const portal = trpc.brands.portal.useQuery({ id }, { enabled: !!id });

  if (portal.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-ink-faint">Opening brand portal…</p>
      </div>
    );
  }
  if (portal.error || !portal.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <p className="font-display text-3xl">This portal isn't published.</p>
        <p className="max-w-md text-sm text-ink-soft">
          Brand portals go live only when their owner publishes them from their studio.
        </p>
        <Link to="/" className="text-brand-accent underline underline-offset-4"><Logo /></Link>
      </div>
    );
  }

  const b = portal.data;
  const d = b.data;
  // upgrade pre-refactor brand rows to the structured-token typography shape
  const typo = normalizeTypography(d.typography);
  const dd = { ...d, typography: typo };
  const primary = dd.colors.list.find((c) => c.role === "primary")?.hex ?? "#0A2A4A";
  const accent = dd.colors.list.find((c) => c.role === "accent")?.hex ?? "#E54B32";

  useEffect(() => { ensureFontsForRefs([typo.heading, typo.body, typo.mono]); }, [typo]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Brand portal — living source of truth</span>
          <Link to="/" className="scale-90"><Logo /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12">
        {/* hero */}
        <div className="hairline-panel bg-panel p-8 md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em]" style={{ color: accent }}>{b.name}</p>
              <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-ink md:text-5xl">{d.dna.essence}</h1>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">{d.dna.positioning}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {d.personality.map((p) => (
                  <span key={p} className="border border-[color:var(--line-strong)] px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink">{p}</span>
                ))}
              </div>
            </div>
            <div className="flex h-32 w-full max-w-[220px] gap-1">
              {d.colors.list.map((c) => <span key={c.role} className="flex-1" style={{ background: c.hex }} />)}
            </div>
          </div>
        </div>

        {/* colour */}
        <section className="mt-10">
          <PortalHeading n="01" title="Colour" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.colors.list.map((c) => {
              const codes = colorCodes(c.hex);
              return (
                <div key={c.role} className="hairline-panel overflow-hidden bg-panel">
                  <div className="h-20" style={{ background: c.hex }} />
                  <div className="p-4">
                    <p className="text-[12.5px] font-semibold capitalize text-ink">{c.role} — {c.name}</p>
                    <p className="mt-1 font-mono-tech text-[10px] text-ink-faint">{codes.hex} · RGB {codes.rgb}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* typography */}
        <section className="mt-12">
          <PortalHeading n="02" title="Typography" />
          <div className="hairline-panel bg-panel p-6">
            <p className="text-4xl text-ink" style={{ fontFamily: fontStack(typo.heading), fontWeight: typo.heading.weights[0] ?? 500 }}>{typo.heading.family}</p>
            <p className="mt-1 text-sm text-ink-soft">with {typo.body.family} for text · {typo.mono.family} for labels</p>
            {typo.ownFonts && (
              <p className="mt-1 text-[11px] text-ink-faint">
                Brand fonts declared by the owner{typo.ownFonts.licenseNote ? ` — ${typo.ownFonts.licenseNote}` : ""}.
              </p>
            )}
            <div className="mt-5 space-y-3 border-t border-[color:var(--line)] pt-5">
              {typo.styles.slice(0, 4).map((s) => (
                <p key={s.name} className="text-ink" style={{ fontFamily: fontStack(styleFont(typo, s)), fontWeight: s.weight, fontSize: s.name === "Display" ? Math.min(s.sizePx, 28) : s.name === "H1" ? Math.min(s.sizePx, 22) : s.name === "H2" ? 18 : 15, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight }}>
                  {s.sample}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* voice */}
        <section className="mt-12">
          <PortalHeading n="03" title="Voice" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="hairline-panel bg-panel p-6">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Tone of voice</p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink">{d.dna.toneOfVoice}</p>
            </div>
            <div className="hairline-panel bg-panel p-6">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Example headlines</p>
              <ul className="mt-3 space-y-2">
                {d.voice.headlines.map((h) => (
                  <li key={h} className="border-l-2 pl-3 font-display text-[15px] text-ink" style={{ borderColor: accent }}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* logo usage */}
        <section className="mt-12">
          <PortalHeading n="04" title="Logo usage" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="hairline-panel bg-panel p-6">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Rules</p>
              <ul className="mt-3 space-y-2.5">
                {[d.logo.clearSpace, d.logo.minSize, d.logo.backgrounds].map((r) => (
                  <li key={r} className="text-[13px] leading-relaxed text-ink">— {r}</li>
                ))}
              </ul>
            </div>
            <div className="hairline-panel bg-panel p-6">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Never</p>
              <ul className="mt-3 space-y-2.5">
                {d.logo.incorrect.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink">
                    <span style={{ color: accent }}>✕</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* do / dont */}
        <section className="mt-12">
          <PortalHeading n="05" title="Do's & don'ts" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border-t-2 bg-panel p-6" style={{ borderColor: primary }}>
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em]" style={{ color: primary }}>Do</p>
              <ul className="mt-3 space-y-2">
                {d.rules.do.map((r) => <li key={r} className="text-[13px] text-ink">✓ {r}</li>)}
              </ul>
            </div>
            <div className="border-t-2 bg-panel p-6" style={{ borderColor: accent }}>
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>Don't</p>
              <ul className="mt-3 space-y-2">
                {d.rules.dont.map((r) => <li key={r} className="text-[13px] text-ink">✕ {r}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-[color:var(--line)] pt-8 pb-4 text-center">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Powered by <span style={{ color: accent }}>BrandKit360</span> — the brand system is the source of truth
          </p>
        </footer>
      </main>
    </div>
  );
}

function PortalHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span className="font-mono-tech text-[11px] tracking-[0.22em] text-brand-accent">{n}</span>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <span className="h-px flex-1 bg-[color:var(--line)]" />
    </div>
  );
}
