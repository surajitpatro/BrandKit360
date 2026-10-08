/** BrandKit360 wordmark + modular Brand Grid mark. */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      {/* Modular brand grid: 2x2 cells, one rotated to suggest the "360" completeness */}
      <rect x="2" y="2" width="12" height="12" fill="currentColor" />
      <rect x="18" y="2" width="12" height="12" fill="currentColor" opacity="0.35" />
      <rect x="2" y="18" width="12" height="12" fill="currentColor" opacity="0.35" />
      <rect x="18" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" transform="rotate(90 24 24)" />
    </svg>
  );
}

export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${dark ? "text-[#F2F0EB]" : "text-ink"}`}>
      <LogoMark />
      <span className="font-display text-[1.3rem] font-semibold tracking-tight">
        BrandKit<span className="text-brand-accent">360</span>
      </span>
    </span>
  );
}
