import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

/** Marketing site header — sticky, transforms on scroll (hairline + background fade). */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-paper/90 backdrop-blur-md border-b border-[color:var(--line)]"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ transitionTimingFunction: "var(--ease-expo)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" aria-label="BrandKit360 home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["How it works", "/#how"],
            ["Before / After", "/#transform"],
            ["Product", "/#system"],
            ["Pricing", "/pricing"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!isLoading &&
            (isAuthenticated ? (
              <Button
                className="btn-clip rounded-none bg-ink px-5 text-[13px] font-semibold tracking-wide text-paper"
                onClick={() => navigate("/app")}
              >
                <span className="btn-mask bg-brand-accent" aria-hidden />
                Open Studio
              </Button>
            ) : (
              <Button
                className="btn-clip rounded-none bg-ink px-5 text-[13px] font-semibold tracking-wide text-paper"
                onClick={() => navigate("/build")}
              >
                <span className="btn-mask bg-brand-accent" aria-hidden />
                Start Building
              </Button>
            ))}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="hairline-t bg-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Your logo is the beginning. Your brand system is what comes next.
          </p>
          <p className="mt-6 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Brand System Platform — v1.0
          </p>
        </div>
        {[
          { h: "Product", links: [["How it works", "/#how"], ["The system", "/#system"], ["Pricing", "/pricing"], ["Start building", "/build"]] },
          { h: "Deliverables", links: [["Brand Guidelines", "/#guidelines"], ["Figma-ready", "/#figma"], ["Brand Portal", "/#portal"], ["AI Studio", "/#ai"]] },
          { h: "Company", links: [["About the philosophy", "/#philosophy"], ["FAQ", "/#faq"], ["Contact", "mailto:hello@brandkit360.com"]] },
        ].map((col) => (
          <div key={col.h}>
            <h4 className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-ink-faint">{col.h}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-sm text-ink-soft transition-colors hover:text-brand-accent">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hairline-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            © {new Date().getFullYear()} BrandKit360
          </p>
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            The brand system is the source of truth.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Small hook: current entitlements (used by chrome CTAs). */
export function useMyEntitlements() {
  const { isAuthenticated } = useAuth();
  const q = trpc.plans.myEntitlements.useQuery(undefined, { enabled: isAuthenticated });
  return {
    entitlements: q.data?.entitlements ?? [],
    planSlug: q.data?.planSlug ?? null,
    isLoading: q.isLoading,
  };
}
