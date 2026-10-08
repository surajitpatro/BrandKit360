import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@contracts/brand";
import { formatConverted, getSavedCurrency } from "@/lib/currency";

/**
 * Checkout — records the order and purchase server-side; entitlements are
 * granted from the completed purchase and enforced by the backend (§30).
 */
export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const plans = trpc.plans.list.useQuery();
  const utils = trpc.useUtils();
  const checkout = trpc.plans.checkout.useMutation({
    onSuccess: () => {
      utils.plans.myEntitlements.invalidate();
      utils.plans.myPurchases.invalidate();
    },
  });

  const plan = plans.data?.find((p) => p.slug === slug);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?next=/checkout/${slug}`);
    }
  }, [authLoading, isAuthenticated, navigate, slug]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-ink-faint">Loading…</p>
      </div>
    );
  }

  if (!plans.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-ink-faint">Loading plans…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl">Plan not found.</p>
        <Link to="/pricing" className="text-brand-accent underline">Back to pricing</Link>
      </div>
    );
  }

  const done = checkout.isSuccess;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8">
        {!done ? (
          <div className="hairline-panel bg-panel">
            <div className="border-b border-[color:var(--line)] px-8 py-6">
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-ink-faint">Checkout</p>
              <h1 className="mt-2 text-3xl">{plan.name}</h1>
              <p className="mt-1 text-sm text-ink-soft">{plan.whoFor}</p>
            </div>
            <div className="px-8 py-7">
              <div className="flex items-baseline justify-between border-b border-[color:var(--line)] pb-5">
                <div>
                  <p className="text-sm font-semibold text-ink">{plan.description}</p>
                  <p className="mt-1 text-[12px] italic text-ink-soft">{plan.corePromise}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl">{formatPrice(plan.price, plan.currency)}</p>
                  {getSavedCurrency() !== plan.currency && (
                    <p className="mt-1 font-mono-tech text-[11px] text-ink-faint">
                      ≈ {formatConverted(plan.price, getSavedCurrency())} · indicative
                    </p>
                  )}
                </div>
              </div>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {plan.deliverables.map((d) => (
                  <li key={d.label} className="flex items-start gap-2 text-[13px] text-ink">
                    <svg className="mt-1 shrink-0" width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
                      <path d="M1 4.5 4 7.5 10 1" stroke="var(--brand-accent)" strokeWidth="1.6" />
                    </svg>
                    {d.label}
                  </li>
                ))}
              </ul>

              <label className="mt-8 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#E54B32]"
                />
                I understand this is a one-time purchase, that my brand system remains
                fully editable and owned by me, and that entitlements are granted to my
                account after checkout.
              </label>

              <button
                disabled={!confirmed || checkout.isPending}
                onClick={() => checkout.mutate({ slug: plan.slug })}
                className="btn-clip mt-8 w-full bg-brand-accent py-4 text-sm font-semibold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="btn-mask bg-ink" aria-hidden />
                {checkout.isPending
                  ? "Processing…"
                  : plan.price === 0
                    ? "Start free — $0"
                    : `Complete purchase — ${formatPrice(plan.price, plan.currency)}`}
              </button>
              {checkout.error && (
                <p className="mt-4 border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                  {checkout.error.message}
                </p>
              )}
              <p className="mt-4 text-center font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Order & entitlement records are created securely on the server. Payment is settled in{" "}
                {plan.currency}.
              </p>
            </div>
          </div>
        ) : (
          <div className="hairline-panel bg-panel px-8 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok text-white">
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden>
                <path d="M2 9.5 8.5 16 22 2" stroke="currentColor" strokeWidth="2.4" />
              </svg>
            </span>
            <h2 className="mt-6 text-3xl">Welcome to {plan.name}.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              {checkout.data?.alreadyOwned
                ? "This plan was already on your account — no charge recorded."
                : "Your order is complete and the plan's capabilities are now active on your account."}{" "}
              {plan.corePromise}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/app")}
                className="btn-clip bg-ink px-8 py-3.5 text-sm font-semibold text-paper"
              >
                <span className="btn-mask bg-brand-accent" aria-hidden />
                Open your Studio
              </button>
              <button
                onClick={() => navigate("/build")}
                className="border border-[color:var(--line-strong)] px-8 py-3.5 text-sm font-semibold text-ink"
              >
                Start a new brand
              </button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
