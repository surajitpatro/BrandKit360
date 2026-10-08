import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import PricingCards from "@/components/PricingCards";

export function PricingSection() {
  const plans = trpc.plans.list.useQuery();

  return (
    <section id="pricing" className="hairline-t bg-paper-2/60">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="sec-marker justify-center" data-reveal>12 / Pricing</p>
          <h2 className="mt-5 text-balance text-3xl md:text-[2.6rem] md:leading-[1.12]" data-reveal style={{ ["--i" as string]: 1 }}>
            Three plans. Based on what you receive.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
            No custom packages, no add-ons, no combinations. One-time purchases,
            priced by deliverable. The difference between plans is obvious at a glance.
          </p>
        </div>
        <div className="mt-14">
          {plans.data ? (
            <PricingCards plans={plans.data} ownedSlugs={[]} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse border border-[color:var(--line)] bg-panel" />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["Is BrandKit360 a logo generator?", "No — and that's the point. Most tools help you create a logo. BrandKit360 builds everything that comes after the logo: the structured, editable brand system that makes a logo usable at all."],
  ["Do I need design skills to use it?", "No. Simple Mode speaks plain language and uses visual controls and presets. Designer Mode exposes exact values, tokens, grids and export settings for professionals. Both work on the same system."],
  ["What if the AI suggests something I don't like?", "Everything AI proposes is a suggestion on an editable system — approve, edit, or discard. Locked elements can't be changed by AI at all, and AI never regenerates your whole system uninvited."],
  ["Are the guidelines really generated automatically?", "Yes. The brand book is compiled from the structured system, so it can never drift out of sync. When you change the system, the document reflects it."],
  ["What formats can I export?", "PDF and web guidelines, SVG/PNG/JPG assets, plus JSON design tokens and CSS variables. Figma-ready output is structured data — variables and styles, not screenshots."],
  ["Is AI required for the product to work?", "No. The core product — questionnaire, Brand DNA, complete system, guidelines, exports — works entirely without AI. AI Studio is an optional layer for moving faster."],
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="hairline-t">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
        <p className="sec-marker justify-center" data-reveal>13 / FAQ</p>
        <h2 className="mt-5 text-center text-3xl md:text-[2.4rem]" data-reveal style={{ ["--i" as string]: 1 }}>
          The questions people actually ask.
        </h2>
        <div className="mt-12 space-y-0 border-t border-[color:var(--line)]">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="border-b border-[color:var(--line)]" data-reveal style={{ ["--i" as string]: i % 3 }}>
              <button
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="font-display text-lg text-ink">{q}</span>
                <span className={`font-mono-tech text-xl transition-transform duration-500 ${open === i ? "rotate-45 text-brand-accent" : "text-ink-faint"}`}>+</span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-500"
                style={{ gridTemplateRows: open === i ? "1fr" : "0fr", transitionTimingFunction: "var(--ease-reveal)" }}
              >
                <div className="overflow-hidden">
                  <p className="max-w-2xl pb-6 text-sm leading-relaxed text-ink-soft">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F2F0EB 1px, transparent 1px), linear-gradient(to bottom, #F2F0EB 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:px-8 md:py-32">
        <p className="font-mono-tech text-[11px] uppercase tracking-[0.24em] text-brand-accent" data-reveal>
          14 / Begin
        </p>
        <h2 className="mt-6 text-balance text-4xl leading-[1.06] md:text-[3.4rem]" data-reveal style={{ ["--i" as string]: 1 }}>
          You already have the logo.
          <br />
          Now build everything after it.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-paper/60" data-reveal style={{ ["--i" as string]: 2 }}>
          Upload your logo, answer five questions, and see your complete brand
          system take shape. Explore first — no account required.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4" data-reveal style={{ ["--i" as string]: 3 }}>
          <button
            onClick={() => navigate("/build")}
            className="btn-clip breathe bg-brand-accent px-9 py-4 text-sm font-semibold tracking-wide text-white"
          >
            <span className="btn-mask bg-paper" aria-hidden />
            <span className="relative z-10 transition-colors duration-500 hover:text-ink">Start Building</span>
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="border border-paper/30 px-9 py-4 text-sm font-semibold tracking-wide text-paper transition-colors hover:border-paper"
          >
            Compare Plans
          </button>
        </div>
        <p className="mt-12 font-display text-lg italic text-paper/50" data-reveal style={{ ["--i" as string]: 4 }}>
          "Build your brand once. Use it everywhere."
        </p>
      </div>
    </section>
  );
}
