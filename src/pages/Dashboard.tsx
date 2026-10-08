import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { runBrandChecks } from "@/lib/brandChecker";
import type { BrandData } from "@contracts/brand";

/** /app — the brand owner's home: their brands, their plan, their next step. */
export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const brands = trpc.brands.list.useQuery(undefined, { enabled: isAuthenticated });
  const ent = trpc.plans.myEntitlements.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const claimStarter = trpc.plans.claimStarter.useMutation();

  // Every signed-up user gets the free Starter plan automatically — they can
  // start building immediately and upgrade later.
  useEffect(() => {
    if (isAuthenticated && ent.data && !ent.data.planSlug && !claimStarter.isPending) {
      claimStarter.mutate(undefined, {
        onSuccess: () => {
          utils.plans.myEntitlements.invalidate();
          utils.plans.myPurchases.invalidate();
        },
      });
    }
  }, [isAuthenticated, ent.data, claimStarter.isPending]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-ink-faint">Loading your studio…</p>
      </div>
    );
  }

  const planName = ent.data?.planSlug
    ? { starter: "STARTER", guidelines: "GUIDELINES", system: "SYSTEM", system_pro: "SYSTEM PRO" }[ent.data.planSlug]
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="hairline-b sticky top-0 z-40 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-5">
            {planName ? (
              <span className="hidden border border-[color:var(--line-strong)] px-3 py-1.5 font-mono-tech text-[10px] tracking-[0.18em] text-ink sm:block">
                PLAN — {planName}
              </span>
            ) : (
              <Link
                to="/pricing"
                className="hidden bg-brand-accent px-3 py-1.5 font-mono-tech text-[10px] tracking-[0.18em] text-white sm:block"
              >
                CHOOSE A PLAN
              </Link>
            )}
            <span className="text-sm text-ink-soft">{user?.name ?? user?.email ?? "Account"}</span>
            <button onClick={() => navigate("/")} className="text-[12px] font-semibold text-ink-soft hover:text-brand-accent">
              Sign out path → home
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="sec-marker">Your studio</p>
            <h1 className="mt-4 text-4xl">Brand systems</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
              Every brand here is a living system — editable, versioned, lockable,
              exportable. The guidelines are just one of its outputs.
            </p>
          </div>
          <button
            onClick={() => navigate("/build")}
            className="btn-clip breathe bg-brand-accent px-7 py-3.5 text-sm font-semibold tracking-wide text-white"
          >
            <span className="btn-mask bg-ink" aria-hidden />
            + New brand system
          </button>
        </div>

        {brands.data && brands.data.length === 0 && (
          <div className="mt-12 hairline-panel bg-panel px-8 py-16 text-center">
            <p className="font-display text-2xl text-ink">No brand systems yet.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Start with your logo — upload it, answer five questions, and watch a
              complete brand system assemble itself around it.
            </p>
            <button
              onClick={() => navigate("/build")}
              className="btn-clip mt-8 bg-ink px-8 py-3.5 text-sm font-semibold text-paper"
            >
              <span className="btn-mask bg-brand-accent" aria-hidden />
              Start with your logo
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(brands.data ?? []).map((b) => {
            const primary = b.data.colors.list[0]?.hex ?? "#0A2A4A";
            const accent = b.data.colors.list[2]?.hex ?? "#E54B32";
            const checks = runBrandChecks(b.data as BrandData);
            const complete = Math.round(
              (checks.filter((c) => c.status !== "fail").length / Math.max(1, checks.length)) * 100,
            );
            return (
              <button
                key={b.id}
                onClick={() => navigate(`/studio/${b.id}`)}
                className="group hairline-panel bg-panel p-6 text-left transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(8,45,79,0.16)]"
              >
                <div className="flex h-20 gap-1">
                  {[primary, b.data.colors.list[1]?.hex, accent, b.data.colors.list[3]?.hex, b.data.colors.list[4]?.hex].map(
                    (hex, i) => hex && <span key={i} className="flex-1" style={{ background: hex }} />,
                  )}
                </div>
                <div className="mt-5 flex items-start gap-4">
                  <BrandThumb assetKey={b.data.logo?.assetKey ?? null} name={b.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-2xl">{b.name}</h2>
                    <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{b.data.brand.business || "Brand system"}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-[color:var(--line)]">
                    <div
                      className={`h-full ${complete >= 90 ? "bg-ok" : "bg-brand-accent"}`}
                      style={{ width: `${complete}%` }}
                    />
                  </div>
                  <span className="font-mono-tech text-[10px] tracking-[0.14em] text-ink-faint">{complete}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[color:var(--line)] pt-4">
                  <span className="font-mono-tech text-[10px] tracking-[0.16em] text-ink-faint">
                    {planName ?? "NO PLAN"} · v{(b.currentVersion / 10).toFixed(1)} · UPDATED{" "}
                    {new Date(b.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="font-mono-tech text-[10px] tracking-[0.16em] text-brand-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    CONTINUE →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {!planName && (
          <div className="mt-14 bg-ink p-8 text-paper md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-brand-accent">What you receive</p>
                <h2 className="mt-3 max-w-xl text-2xl md:text-3xl">
                  You haven't chosen a plan yet — your exploration is saved, and waiting.
                </h2>
              </div>
              <Link
                to="/pricing"
                className="btn-clip bg-brand-accent px-7 py-3.5 text-sm font-semibold tracking-wide text-white"
              >
                <span className="btn-mask bg-paper" aria-hidden />
                <span className="relative z-10 transition-colors duration-500 hover:text-ink">See the three plans</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** Logo thumbnail from cloud storage (brand-scoped asset; falls back to a monogram). */
function BrandThumb({ assetKey, name }: { assetKey: string | null; name: string }) {
  const urlQ = trpc.storage.url.useQuery({ key: assetKey! }, { enabled: !!assetKey });
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-[color:var(--line)] bg-paper">
      {urlQ.data?.url ? (
        <img src={urlQ.data.url} alt={`${name} logo`} className="max-h-10 max-w-10 object-contain" />
      ) : (
        <span className="font-display text-lg text-ink-faint">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
