import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import type { BrandData, Entitlement } from "@contracts/brand";
import { normalizeTypography } from "@/lib/fontLibrary";
import {
  OverviewPanel, DnaPanel, LogoPanel, ColourPanel, TypographyPanel,
  GraphicsPanel, PhotographyPanel, IllustrationPanel, IconographyPanel,
  LayoutPanel, VoicePanel, TokensPanel, ApplicationsPanel, LockPanel,
} from "@/sections/studio/BasicPanels";
import {
  VersionsPanel, GuidelinesPanel, PortalPanel, CheckerPanel, AiStudioPanel, SettingsPanel,
} from "@/sections/studio/ProPanels";

type SectionKey =
  | "overview" | "dna" | "logo" | "colour" | "typography" | "graphics" | "photography"
  | "illustration" | "iconography" | "layout" | "voice" | "tokens" | "applications"
  | "lock" | "versions" | "guidelines" | "portal" | "checker" | "ai" | "assets" | "settings";

const SECTIONS: { key: SectionKey; label: string; group: string; entitlement?: Entitlement }[] = [
  { key: "overview", label: "Overview", group: "System" },
  { key: "dna", label: "Brand DNA", group: "System" },
  { key: "logo", label: "Logo", group: "System" },
  { key: "colour", label: "Colour", group: "System" },
  { key: "typography", label: "Typography", group: "System" },
  { key: "graphics", label: "Graphics", group: "System" },
  { key: "photography", label: "Photography", group: "System" },
  { key: "voice", label: "Voice", group: "System" },
  { key: "applications", label: "Applications", group: "System" },
  { key: "illustration", label: "Illustration", group: "Design system", entitlement: "brand_system" },
  { key: "iconography", label: "Iconography", group: "Design system", entitlement: "brand_system" },
  { key: "layout", label: "Layout", group: "Design system", entitlement: "brand_system" },
  { key: "tokens", label: "Design Tokens", group: "Design system", entitlement: "brand_system" },
  { key: "lock", label: "Brand Lock", group: "Trust" },
  { key: "versions", label: "Versions", group: "Trust", entitlement: "brand_system" },
  { key: "guidelines", label: "Guidelines", group: "Outputs", entitlement: "brand_guidelines" },
  { key: "portal", label: "Brand Portal", group: "Outputs", entitlement: "brand_portal" },
  { key: "checker", label: "Brand Checker", group: "Pro", entitlement: "brand_checker" },
  { key: "ai", label: "AI Studio", group: "Pro", entitlement: "ai_studio" },
  { key: "settings", label: "Settings", group: "Workspace" },
];

export default function Studio() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth({ redirectOnUnauthenticated: true });
  const id = Number(brandId);

  const brandQ = trpc.brands.get.useQuery({ id }, { enabled: isAuthenticated && !!id });
  const entQ = trpc.plans.myEntitlements.useQuery(undefined, { enabled: isAuthenticated });
  const imageryQ = trpc.imagery.list.useQuery({ brandId: id }, { enabled: isAuthenticated && !!id });
  const launchStatus = trpc.imagery.launchStatus.useQuery(
    { brandId: id },
    { enabled: isAuthenticated && !!id, refetchInterval: (q) => (q.state.data?.inFlight ? 8000 : false) },
  );
  const launchSet = trpc.imagery.generateLaunchSet.useMutation();
  const launchFiredFor = useRef<number | null>(null);
  const utils = trpc.useUtils();

  // Lazy catch-up: brands created before automatic imagery (or where the
  // post-save trigger was missed) get their launch set the moment they open.
  useEffect(() => {
    if (launchFiredFor.current === id) return;
    if (
      entQ.data?.entitlements.includes("brand_guidelines") &&
      imageryQ.data &&
      imageryQ.data.length === 0 &&
      !launchStatus.data?.inFlight
    ) {
      launchFiredFor.current = id;
      launchSet.mutate({ brandId: id });
    }
  }, [id, entQ.data, imageryQ.data, launchStatus.data]);

  const [section, setSection] = useState<SectionKey>("overview");
  const [data, setData] = useState<BrandData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (brandQ.data) {
      const raw = brandQ.data.data;
      // upgrade pre-refactor rows to structured-token typography
      setData({ ...raw, typography: normalizeTypography(raw.typography) });
    }
  }, [brandQ.data]);

  const update = useMemo(
    () => (fn: (d: BrandData) => BrandData) => {
      setData((d) => (d ? fn(d) : d));
      setDirty(true);
      setJustSaved(false);
    },
    [],
  );

  const save = trpc.brands.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      setJustSaved(true);
      utils.brands.get.invalidate({ id });
      utils.brands.list.invalidate();
      utils.brands.versions.invalidate({ id });
    },
  });

  if (isLoading || !isAuthenticated || brandQ.isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-ink-faint">Opening your brand system…</p>
      </div>
    );
  }
  if (brandQ.error || !brandQ.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
        <p className="font-display text-2xl">Brand not found.</p>
        <Link to="/app" className="text-brand-accent underline">Back to your studio</Link>
      </div>
    );
  }

  const entitlements: Entitlement[] = entQ.data?.entitlements ?? [];
  const has = (e?: Entitlement) => !e || entitlements.includes(e);
  const brand = brandQ.data;
  const lockedColours = data.locked.includes("colour");
  const lockedTypography = data.locked.includes("typography");

  const toggleLock = (key: string) =>
    update((d) => ({
      ...d,
      locked: d.locked.includes(key) ? d.locked.filter((k) => k !== key) : [...d.locked, key],
    }));

  const groups = ["System", "Design system", "Trust", "Outputs", "Pro", "Workspace"];

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[color:var(--line)] bg-panel lg:flex">
        <div className="hairline-b flex h-16 items-center px-5">
          <Link to="/app"><Logo /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g} className="mb-5">
              <p className="px-2 pb-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-ink-faint">{g}</p>
              {SECTIONS.filter((s) => s.group === g).map((s) => {
                const allowed = has(s.entitlement);
                return (
                  <button
                    key={s.key}
                    onClick={() => setSection(s.key)}
                    className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-[13px] transition-colors ${
                      section === s.key ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper hover:text-ink"
                    } ${!allowed ? "opacity-50" : ""}`}
                  >
                    {s.label}
                    {!allowed && <span className="font-mono-tech text-[8px] tracking-[0.12em] text-brand-accent">PRO</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="hairline-t p-4">
          <Link to="/pricing" className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint hover:text-brand-accent">
            {entQ.data?.planSlug ? `Plan: ${entQ.data.planSlug.replace("_", " ").toUpperCase()} — manage` : "Choose a plan →"}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        {/* Topbar */}
        <header className="hairline-b sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-paper/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            {/* mobile section select */}
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as SectionKey)}
              className="max-w-[38vw] border border-[color:var(--line-strong)] bg-panel px-2 py-1.5 text-[13px] lg:hidden"
            >
              {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}{!has(s.entitlement) ? " (Pro)" : ""}</option>)}
            </select>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate font-display text-xl leading-tight">{brand.name}</p>
              <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-ink-faint">
                Brand v{(brand.currentVersion / 10).toFixed(1)}{dirty ? " · unsaved changes" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {justSaved && !dirty && (
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-ok">Saved — version created</span>
            )}
            <button
              onClick={() => save.mutate({ id, data })}
              disabled={!dirty || save.isPending}
              className="btn-clip bg-ink px-5 py-2.5 text-[12px] font-semibold tracking-wide text-paper disabled:opacity-40"
            >
              <span className="btn-mask bg-brand-accent" aria-hidden />
              {save.isPending ? "Saving…" : "Save"}
            </button>
            <Link to="/app" className="hidden text-[12px] font-semibold text-ink-soft hover:text-brand-accent md:block">
              All brands
            </Link>
          </div>
        </header>

        {/* Panel */}
        <main className="flex-1 px-5 py-10 md:px-8">
          {!has(SECTIONS.find((s) => s.key === section)?.entitlement) ? (
            <UpgradeGate section={SECTIONS.find((s) => s.key === section)!.label} />
          ) : (
            <div className="mx-auto max-w-4xl">
              {section === "overview" && <OverviewPanel data={data} brandName={brand.name} />}
              {section === "dna" && <DnaPanel data={data} update={update} />}
              {section === "logo" && <LogoPanel data={data} update={update} toggleLock={toggleLock} />}
              {section === "colour" && (
                <ColourPanel data={data} update={update} locked={lockedColours} toggleLock={() => toggleLock("colour")} />
              )}
              {section === "typography" && (
                <TypographyPanel data={data} update={update} locked={lockedTypography} toggleLock={() => toggleLock("typography")} />
              )}
              {section === "graphics" && <GraphicsPanel data={data} update={update} />}
              {section === "photography" && <PhotographyPanel data={data} update={update} brandId={id} />}
              {section === "illustration" && <IllustrationPanel data={data} />}
              {section === "iconography" && <IconographyPanel data={data} />}
              {section === "layout" && <LayoutPanel data={data} />}
              {section === "voice" && <VoicePanel data={data} update={update} />}
              {section === "tokens" && <TokensPanel data={data} />}
              {section === "applications" && <ApplicationsPanel data={data} />}
              {section === "lock" && <LockPanel data={data} toggleLock={toggleLock} />}
              {section === "versions" && <VersionsPanel brandId={id} currentVersion={brand.currentVersion} />}
              {section === "guidelines" && <GuidelinesPanel data={data} brandName={brand.name} brandId={id} />}
              {section === "portal" && (
                <PortalPanel brandId={id} enabled={brand.portalEnabled} brandName={brand.name} />
              )}
              {section === "checker" && <CheckerPanel data={data} />}
              {section === "ai" && <AiStudioPanel data={data} />}
              {section === "settings" && (
                <SettingsPanel brandId={id} name={brand.name} onDeleted={() => navigate("/app")} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function UpgradeGate({ section }: { section: string }) {
  return (
    <div className="mx-auto max-w-lg hairline-panel bg-panel px-8 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[color:var(--line-strong)]">
        <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden>
          <rect x="2" y="8" width="14" height="10" stroke="var(--ink)" strokeWidth="1.5" />
          <path d="M5 8V6a4 4 0 0 1 8 0v2" stroke="var(--ink)" strokeWidth="1.5" />
        </svg>
      </span>
      <h2 className="mt-6 text-2xl">{section} is part of a higher plan.</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Your current plan keeps this brand system fully editable. Upgrade to unlock
        this capability — entitlements are enforced on the server the moment you upgrade.
      </p>
      <Link
        to="/pricing"
        className="btn-clip mt-8 inline-block bg-brand-accent px-8 py-3.5 text-sm font-semibold tracking-wide text-white"
      >
        <span className="btn-mask bg-ink" aria-hidden />
        Compare plans
      </Link>
    </div>
  );
}
