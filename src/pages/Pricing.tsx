import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useRevealObserver } from "@/hooks/useReveal";
import { trpc } from "@/providers/trpc";
import PricingCards from "@/components/PricingCards";

export default function Pricing() {
  useRevealObserver();
  const plans = trpc.plans.list.useQuery();
  const ownedSlugs: string[] = [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="brand-grid-bg absolute inset-0 opacity-50" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-24">
            <p className="sec-marker" data-reveal>Pricing — what you receive</p>
            <h1 className="mt-6 max-w-2xl text-balance text-4xl leading-[1.06] md:text-[3.2rem]" data-reveal style={{ ["--i" as string]: 1 }}>
              Start free. Upgrade when the brand grows.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft" data-reveal style={{ ["--i" as string]: 2 }}>
              The free Starter plan lets you build one complete brand system — no
              card, no trial clock. Paid plans are one-time purchases that unlock
              more of the system: a professional brand book, a complete editable
              system, or full brand infrastructure.
            </p>
          </div>
        </section>
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            {plans.data ? (
              <PricingCards plans={plans.data} ownedSlugs={ownedSlugs} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-96 animate-pulse border border-[color:var(--line)] bg-panel" />
                ))}
              </div>
            )}
            <div className="mt-16 grid gap-px border border-[color:var(--line)] bg-[color:var(--line)] md:grid-cols-3">
              {[
                ["Start free", "The Starter plan is $0 forever — one brand system, live preview, basic editing. No card, no trial clock. Upgrade only when you need more."],
                ["Honest by design", "We never present detected properties as facts, never invent logo variants you shouldn't use, and never claim integrations that aren't real."],
                ["Upgrade path", "Start with the free Starter plan — paid plans are one-time purchases, upgrade any time. Your brand, your data, your system — you own it."],
              ].map(([t, d], i) => (
                <div key={t} className="bg-panel p-7" data-reveal style={{ ["--i" as string]: i }}>
                  <h3 className="font-semibold text-ink">{t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
