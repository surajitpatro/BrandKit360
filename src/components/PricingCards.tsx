import { useState } from "react";
import { useNavigate } from "react-router";
import { formatPrice } from "@contracts/brand";
import type { Plan } from "@db/schema";
import {
  CURRENCY_OPTIONS,
  formatConverted,
  getSavedCurrency,
  setSavedCurrency,
} from "@/lib/currency";

/** §12 — plan cards focused on WHAT YOU RECEIVE (§28), not feature jargon. */
export default function PricingCards({ plans, ownedSlugs = [] }: { plans: Plan[]; ownedSlugs?: string[] }) {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(getSavedCurrency);
  const changeCurrency = (code: string) => {
    setCurrency(code);
    setSavedCurrency(code);
  };
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Display prices in
        </span>
        <select
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
          className="border border-[color:var(--line-strong)] bg-panel px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-ink outline-none focus:border-brand-accent"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
      </div>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
      {plans.map((plan, i) => {
        const owned = ownedSlugs.includes(plan.slug);
        const popular = plan.badge?.toUpperCase().includes("POPULAR");
        const base = plan.currency;
        const showConverted = currency !== base;
        const priceLabel = showConverted
          ? formatConverted(plan.price, currency)
          : formatPrice(plan.price, base);
        const compareLabel =
          plan.comparePrice && plan.comparePrice > plan.price
            ? showConverted
              ? formatConverted(plan.comparePrice, currency)
              : formatPrice(plan.comparePrice, base)
            : null;
        return (
          <div
            key={plan.slug}
            className={`relative flex flex-col border border-[color:var(--line)] bg-panel p-8 transition-shadow duration-500 ${
              popular ? "z-10 border-ink shadow-[0_24px_60px_rgba(8,45,79,0.18)] lg:-my-4 lg:py-12" : ""
            }`}
            data-reveal
            style={{ ["--i" as string]: i }}
          >
            {plan.badge && (
              <span className="absolute -top-px right-6 bg-brand-accent px-3 py-1 font-mono-tech text-[9px] tracking-[0.2em] text-white">
                {plan.badge}
              </span>
            )}
            <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">{plan.name}</p>
            <h3 className="mt-3 text-2xl">{plan.description}</h3>
            <p className="mt-2 min-h-[2.5rem] text-[13px] leading-relaxed text-ink-soft">{plan.whoFor}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-2">
              {compareLabel && (
                <span className="font-mono-tech text-sm text-ink-faint line-through">{compareLabel}</span>
              )}
              <span className="font-display text-4xl">{priceLabel}</span>
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {plan.price === 0 ? "free forever" : "one-time"}
              </span>
            </div>
            {showConverted && (
              <p className="mt-1 font-mono-tech text-[11px] tracking-[0.08em] text-ink-faint">
                {formatPrice(plan.price, base)} · indicative rate
              </p>
            )}

            <p className="mt-4 border-l-2 border-brand-accent pl-3 text-[13px] italic leading-relaxed text-ink-soft">
              {plan.corePromise}
            </p>

            <ul className="mt-6 flex-1 space-y-2">
              {plan.deliverables.map((d) => (
                <li key={d.label} className="flex items-start gap-2.5 text-[13px] text-ink">
                  <svg className="mt-1 shrink-0" width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
                    <path d="M1 4.5 4 7.5 10 1" stroke="var(--brand-accent)" strokeWidth="1.6" />
                  </svg>
                  {d.label}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[12px] leading-relaxed text-ink-faint">{plan.result}</p>

            <button
              onClick={() => navigate(owned ? "/app" : plan.price === 0 ? "/checkout/starter" : `/checkout/${plan.slug}`)}
              className={`btn-clip mt-7 w-full py-3.5 text-sm font-semibold tracking-wide transition-colors ${
                popular
                  ? "bg-brand-accent text-white"
                  : "border border-[color:var(--line-strong)] text-ink hover:text-paper"
              } ${owned ? "bg-ok !text-white" : ""}`}
            >
              {!owned && <span className={`btn-mask ${popular ? "bg-ink" : "bg-ink"}`} aria-hidden />}
              {owned
                ? "Included in your plan — Open Studio"
                : plan.price === 0
                  ? "Start free"
                  : `Choose ${plan.name}`}
            </button>
          </div>
        );
      })}
    </div>
      {currency !== "USD" && (
        <p className="mt-8 text-center font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Converted at indicative rates for reference — checkout is settled in USD.
        </p>
      )}
    </div>
  );
}
