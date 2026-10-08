import { useEffect, useMemo, useState } from "react";
import type { FontCategory, FontRef } from "@contracts/brand";
import {
  FONT_COUNT,
  fontStack,
  searchFonts,
  toFontRef,
  ensureFonts,
  type FontEntry,
} from "@/lib/fontLibrary";

/**
 * Searchable font picker over the library. Live "Aa" previews render in the
 * actual font (loaded on demand). Used in the build wizard and the studio.
 */
export function FontPicker({
  value,
  onChange,
  bestFor,
  personality,
  disabled,
  excludeFamily,
}: {
  value: FontRef;
  onChange: (ref: FontRef, entry: FontEntry) => void;
  bestFor: "heading" | "body" | "mono";
  personality?: string[];
  disabled?: boolean;
  excludeFamily?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | undefined>();

  const [shown, setShown] = useState(12);
  const total = useMemo(() => {
    let list = searchFonts(query, category).filter((f) =>
      bestFor === "mono" ? f.category === "mono" : f.bestFor === bestFor || f.bestFor === "both",
    );
    if (excludeFamily) list = list.filter((f) => f.family !== excludeFamily);
    // curated + personality-matching fonts first when no query
    if (!query.trim() && personality?.length) {
      const score = (f: FontEntry) => f.tags.filter((t) => personality.includes(t)).length;
      list = [...list].sort((a, b) => score(b) - score(a));
    } else if (query.trim()) {
      // while searching: curated matches first, then directory popularity
      const curated = list.filter((f) => f.tags.length > 0);
      const rest = list.filter((f) => !f.tags.length).sort((a, b) => (a.popularity ?? 9999) - (b.popularity ?? 9999));
      list = [...curated, ...rest];
    }
    return list;
  }, [query, category, bestFor, personality, excludeFamily]);
  const results = total.slice(0, shown);

  useEffect(() => {
    setShown(12);
  }, [query, category, bestFor]);

  useEffect(() => {
    if (open) ensureFonts(results.slice(0, 8));
  }, [open, results]);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-3 border border-[color:var(--line-strong)] bg-paper px-4 py-3 text-left transition-colors hover:border-ink disabled:opacity-50"
      >
        <span>
          <span className="block text-[14px] font-semibold text-ink" style={{ fontFamily: fontStack(value) }}>
            {value.family}
          </span>
          <span className="block font-mono-tech text-[9px] uppercase tracking-[0.14em] text-ink-faint">
            {value.source} · {value.category}
          </span>
        </span>
        <span className="font-mono-tech text-[10px] text-ink-faint">{open ? "close" : "change"}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-72 border border-[color:var(--line-strong)] bg-panel shadow-[0_16px_40px_rgba(8,45,79,0.16)]">
          <div className="border-b border-[color:var(--line)] p-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${bestFor} fonts — name, mood, serif…`}
              className="w-full border border-[color:var(--line-strong)] bg-paper px-3 py-2 text-[13px] outline-none focus:border-brand-accent"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["serif", "sans", "display", "mono"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? undefined : c)}
                  className={`border px-2.5 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.12em] ${
                    category === c ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {results.map((f) => {
              const active = f.family === value.family;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    onChange(toFontRef(f), f);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                    active ? "bg-ink text-paper" : "hover:bg-paper"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold" style={{ fontFamily: fontStack({ family: f.family, category: f.category }) }}>
                      {f.family}
                    </span>
                    <span className={`block truncate text-[11px] ${active ? "text-paper/60" : "text-ink-faint"}`}>
                      {f.note}
                    </span>
                  </span>
                  <span className={`shrink-0 text-2xl leading-none ${active ? "text-brand-accent" : "text-ink"}`} style={{ fontFamily: fontStack({ family: f.family, category: f.category }) }}>
                    Aa
                  </span>
                </button>
              );
            })}
            {!results.length && (
              <p className="px-4 py-6 text-center font-mono-tech text-[11px] text-ink-faint">
                No fonts match “{query}”. Try a mood like “elegant” or “modern”.
              </p>
            )}
            {total.length > shown && (
              <button
                onClick={() => setShown((s) => s + 24)}
                className="w-full border-t border-[color:var(--line)] px-4 py-2.5 text-center font-mono-tech text-[10px] uppercase tracking-[0.14em] text-brand-accent hover:bg-paper"
              >
                Show {Math.min(24, total.length - shown)} more of {total.length - shown} matching
              </button>
            )}
          </div>
          <p className="border-t border-[color:var(--line)] px-4 py-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-ink-faint">
            {FONT_COUNT.toLocaleString()} Google Fonts families — full directory, loaded on demand · Adobe Fonts & uploads coming
          </p>
        </div>
      )}
    </div>
  );
}
