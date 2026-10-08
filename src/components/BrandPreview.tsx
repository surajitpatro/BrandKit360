import { useEffect } from "react";
import type { BrandColor, TypographySystem } from "@contracts/brand";
import { fontStack, ensureFontsForRefs } from "@/lib/fontLibrary";
import { readableOn } from "@/lib/colorUtils";

/**
 * Live brand composition — the palette and typography applied to a real
 * mini-layout: name, headline, body, buttons, labels. Used in the build
 * wizard's Colour Direction step and in the studio so every colour or
 * font decision shows its consequence immediately.
 */
export function BrandPreview({
  colors,
  typography,
  brandName,
  essence,
  compact = false,
}: {
  colors: BrandColor[];
  typography: TypographySystem;
  brandName: string;
  essence?: string;
  compact?: boolean;
}) {
  const by = (role: string) => colors.find((c) => c.role === role);
  const primary = by("primary");
  const accent = by("accent");
  const background = by("background");
  const text = by("text");
  const bg = background?.hex ?? "#F7F6F2";
  const ink = text?.hex ?? "#1A1A1A";

  useEffect(() => {
    ensureFontsForRefs([typography.heading, typography.body, typography.mono]);
  }, [typography]);

  const h = typography.styles.find((s) => s.name === "H1") ?? typography.styles[1];
  const body = typography.styles.find((s) => s.name === "Body");
  const label = typography.styles.find((s) => s.role === "label");
  const displayW = h?.weight ?? 500;

  return (
    <div
      className="overflow-hidden border border-[color:var(--line)]"
      style={{ background: bg, color: ink }}
    >
      {/* hairline brand strip */}
      <div className="flex h-1.5">
        {colors.map((c) => (
          <span key={c.role} className="flex-1" style={{ background: c.hex }} />
        ))}
      </div>
      <div className={compact ? "p-5" : "p-6 md:p-8"}>
        <div className="flex items-baseline justify-between gap-4">
          <p
            className="font-mono-tech text-[9px] uppercase tracking-[0.2em] opacity-70"
            style={{ fontFamily: label ? fontStack(typography.mono) : undefined }}
          >
            {brandName || "Your Brand"}
          </p>
          {primary && (
            <span className="h-2 w-2" style={{ background: primary.hex }} />
          )}
        </div>
        <h4
          className="mt-3 text-balance leading-tight"
          style={{
            fontFamily: fontStack(typography.heading),
            fontWeight: displayW,
            fontSize: compact ? 22 : 28,
            letterSpacing: "-0.015em",
          }}
        >
          {essence ?? "A brand system that looks like you on purpose."}
        </h4>
        {body && (
          <p
            className="mt-3 max-w-md leading-relaxed opacity-75"
            style={{ fontFamily: fontStack(typography.body), fontSize: 13.5 }}
          >
            One change updates every surface — guidelines, portal, tokens, templates. The system is the source of truth.
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {primary && (
            <span
              className="px-4 py-2 text-[12px] font-semibold"
              style={{ background: primary.hex, color: readableOn(primary.hex) }}
            >
              Primary action
            </span>
          )}
          {accent && (
            <span
              className="px-4 py-2 text-[12px] font-semibold"
              style={{ background: accent.hex, color: readableOn(accent.hex) }}
            >
              Accent
            </span>
          )}
          {primary && (
            <span
              className="border px-4 py-2 text-[12px] font-semibold"
              style={{ borderColor: primary.hex, color: primary.hex }}
            >
              Ghost
            </span>
          )}
        </div>
        {label && (
          <p
            className="mt-5 border-t pt-3 text-[9px] uppercase opacity-50"
            style={{
              fontFamily: fontStack(typography.mono),
              letterSpacing: "0.14em",
              borderColor: `${ink}22`,
            }}
          >
            {(primary?.hex ?? "").toUpperCase()} / {(accent?.hex ?? "").toUpperCase()} — LIVE PREVIEW
          </p>
        )}
      </div>
    </div>
  );
}
