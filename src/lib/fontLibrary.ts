/**
 * BrandKit360 font library — source-aware by design.
 *
 * MVP source: Google Fonts (loaded on demand via the css2 API, display=swap).
 * The library schema is built so Adobe Fonts and owner-uploaded fonts become
 * additional `FontSource` values with no contract change:
 *   - "adobe"   → family name resolved through a future Adobe kit; no GF link
 *   - "custom"  → owner-declared name (rendered when installed, graceful fallback)
 *
 * Everything typography in the product (wizard, studio, tokens export,
 * guidelines, portal, checker) reads from TypographySystem built here.
 */
import type {
  FontCategory,
  FontRef,
  FontSource,
  TypeStyle,
  TypographySystem,
} from "../../contracts/brand";
import { FONT_CATALOG } from "./fontCatalog";

export interface FontEntry {
  id: string;
  family: string;
  source: FontSource;
  category: FontCategory;
  /** static fonts list instances; variable fonts give a range spec */
  availableWeights: number[];
  /** google css2 axis spec — full wght range for variable fonts */
  gfSpec: string;
  tags: string[]; // personality affinities
  bestFor: "heading" | "body" | "mono" | "both";
  note: string;
  /** directory popularity rank (curated entries have none and rank first) */
  popularity?: number;
}

const g = (
  id: string,
  family: string,
  category: FontCategory,
  availableWeights: number[],
  gfSpec: string,
  tags: string[],
  bestFor: FontEntry["bestFor"],
  note: string,
): FontEntry => ({ id, family, source: "google", category, availableWeights, gfSpec, tags, bestFor, note });

export const FONT_LIBRARY: FontEntry[] = [
  // ---- Serif (editorial authority) ----
  g("fraunces", "Fraunces", "serif", [300, 400, 500, 600, 700], "Fraunces:opsz,wght@9..144,100..900", ["premium", "elegant", "traditional", "friendly"], "both", "Soft, wonky editorial serif with optical sizing — warmth and authority in one face."),
  g("playfair", "Playfair Display", "serif", [400, 500, 600, 700, 800, 900], "Playfair Display:wght@400..900", ["premium", "elegant", "bold"], "heading", "High-contrast display serif for brands that need to be noticed first."),
  g("newsreader", "Newsreader", "serif", [300, 400, 500, 600, 700], "Newsreader:opsz,wght@6..72,200..800", ["premium", "traditional", "trustworthy"], "both", "Literary text serif with genuine body-copy texture; italic has real character."),
  g("lora", "Lora", "serif", [400, 500, 600, 700], "Lora:wght@400..700", ["trustworthy", "traditional", "friendly"], "both", "Balanced contemporary serif — calm, readable, quietly credible."),
  g("source-serif", "Source Serif 4", "serif", [300, 400, 600, 700], "Source Serif 4:opsz,wght@8..60,200..900", ["professional", "trustworthy", "traditional"], "body", "Adobe's open serif: disciplined, neutral, superb for long reading."),
  g("cormorant", "Cormorant Garamond", "serif", [300, 400, 500, 600, 700], "Cormorant Garamond:wght@300..700", ["elegant", "premium", "minimal"], "heading", "Tall, poised Garamond revival — couture-level delicacy for display sizes."),
  g("eb-garamond", "EB Garamond", "serif", [400, 500, 600, 700], "EB Garamond:wght@400..800", ["traditional", "elegant", "trustworthy"], "both", "The classic book face — heritage without dust."),
  g("spectral", "Spectral", "serif", [300, 400, 500, 600, 700], "Spectral:wght@200..800", ["professional", "modern", "trustworthy"], "body", "Designed for screen reading by Production Type; precise and contemporary."),
  g("merriweather", "Merriweather", "serif", [300, 400, 700, 900], "Merriweather:wght@300..900", ["friendly", "trustworthy", "traditional"], "body", "Generous x-height serif that stays legible at small sizes."),
  g("gloock", "Gloock", "serif", [400], "Gloock:wght@400", ["elegant", "premium", "bold"], "heading", "A display Didone with soft edges — drama that stays warm."),

  // ---- Sans (modern clarity) ----
  g("inter", "Inter", "sans", [300, 400, 500, 600, 700, 800], "Inter:wght@100..900", ["modern", "minimal", "professional", "innovative"], "both", "The neutral grotesque of product design; weight does the hierarchy work."),
  g("work-sans", "Work Sans", "sans", [300, 400, 500, 600, 700], "Work Sans:wght@100..900", ["friendly", "modern", "professional"], "both", "Open, slightly quirky grotesque — approachable without being casual."),
  g("public-sans", "Public Sans", "sans", [300, 400, 500, 600, 700, 800], "Public Sans:wght@100..900", ["professional", "trustworthy", "modern"], "both", "USWDS-derived neutral sans — governmental clarity without the boredom."),
  g("manrope", "Manrope", "sans", [300, 400, 500, 600, 700, 800], "Manrope:wght@200..800", ["modern", "innovative", "friendly"], "both", "Geometric-humanist hybrid with a technical edge; excellent on screens."),
  g("figtree", "Figtree", "sans", [300, 400, 500, 600, 700, 800, 900], "Figtree:wght@300..900", ["friendly", "modern", "energetic"], "both", "Round, upbeat sans that keeps serious structure — the friendly professional."),
  g("dm-sans", "DM Sans", "sans", [300, 400, 500, 700, 1000], "DM Sans:opsz,wght@9..40,100..1000", ["minimal", "modern", "friendly"], "both", "Geometric with low contrast; crisp at UI sizes, elegant in headlines."),
  g("space-grotesk", "Space Grotesk", "sans", [300, 400, 500, 600, 700], "Space Grotesk:wght@300..700", ["innovative", "modern", "bold", "energetic"], "both", "Tech-inflected grotesque with geometric hooks; startup energy, grown up."),
  g("archivo", "Archivo", "sans", [400, 500, 600, 700, 800, 900], "Archivo:wdth,wght@62..125,100..900", ["bold", "energetic", "modern"], "heading", "Expanded grotesque family — poster-width headlines with real force."),
  g("outfit", "Outfit", "sans", [300, 400, 500, 600, 700], "Outfit:wght@100..900", ["modern", "minimal", "friendly"], "both", "Clean geometric sans with wide apertures; friendly precision."),
  g("plus-jakarta", "Plus Jakarta Sans", "sans", [300, 400, 500, 600, 700, 800], "Plus Jakarta Sans:wght@200..800", ["friendly", "energetic", "modern"], "both", "Contemporary Indonesian grotesque — warm, energetic, very current."),
  g("nunito-sans", "Nunito Sans", "sans", [300, 400, 600, 700, 800, 900], "Nunito Sans:opsz,wght@6..12,200..1000", ["friendly", "playful", "trustworthy"], "body", "Rounded terminals take the edge off; human without losing structure."),
  g("rubik", "Rubik", "sans", [300, 400, 500, 600, 700, 800, 900], "Rubik:wght@300..900", ["friendly", "playful", "modern"], "both", "Slightly rounded cube-inspired sans; confident at display sizes."),

  // ---- Display ----
  g("bricolage", "Bricolage Grotesque", "display", [300, 400, 500, 700, 800], "Bricolage Grotesque:opsz,wght@12..96,200..800", ["bold", "innovative", "playful", "modern"], "heading", "Variable display grotesque that morphs from text to poster — very now."),
  g("bebas", "Bebas Neue", "display", [400], "Bebas Neue:wght@400", ["bold", "energetic", "minimal"], "heading", "All-caps industrial narrow — instant poster presence."),
  g("marcellus", "Marcellus", "display", [400], "Marcellus:wght@400", ["elegant", "premium", "traditional"], "heading", "Roman-inspired display face — hotel-lobby poise."),

  // ---- Mono (labels, tokens, technical) ----
  g("space-mono", "Space Mono", "mono", [400, 700], "Space Mono:wght@400;700", ["innovative", "modern", "playful"], "mono", "Geometric mono with personality — labels and tokens with a wink."),
  g("ibm-plex-mono", "IBM Plex Mono", "mono", [300, 400, 500, 600, 700], "IBM Plex Mono:wght@100..700", ["professional", "modern", "trustworthy"], "mono", "Corporate-memo mono done with taste; the safe technical voice."),
  g("jetbrains", "JetBrains Mono", "mono", [300, 400, 500, 700, 800], "JetBrains Mono:wght@100..800", ["innovative", "modern", "professional"], "mono", "Developer-grade mono, legible at tiny sizes."),
  g("roboto-mono", "Roboto Mono", "mono", [300, 400, 500, 700], "Roboto Mono:wght@100..700", ["professional", "minimal", "modern"], "mono", "Neutral technical mono that pairs with anything."),
];

export const CATEGORY_FALLBACK: Record<FontCategory, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Helvetica Neue', Arial, sans-serif",
  display: "'Arial Narrow', 'Helvetica Neue', sans-serif",
  mono: "'Courier New', monospace",
};

// ---------- the full Google Fonts directory (1,959 families) ----------
//
// The curated entries above carry rich editorial metadata (tags, notes);
// every other family in the Google Fonts directory is available too — search,
// preview and selection all work the same, and fonts load on demand.

const curatedIds = new Set(FONT_LIBRARY.map((f) => f.id));

const catalogCategory = (c: string): FontCategory =>
  c === "sans-serif" ? "sans" : c === "monospace" ? "mono" : c === "serif" ? "serif" : "display";

const catalogBestFor = (c: string): FontEntry["bestFor"] =>
  c === "monospace" ? "mono" : c === "sans-serif" ? "both" : "heading";

const catalogEntries: FontEntry[] = FONT_CATALOG.filter(
  ([id, family]) => !curatedIds.has(id) && !FONT_LIBRARY.some((f) => f.family === family),
).map(([id, family, category, weights, popularity]) => ({
  id,
  family,
  source: "google",
  category: catalogCategory(category),
  availableWeights: weights,
  // discrete static weights — the css2 API serves exactly these instances
  gfSpec: `${family}:wght@${weights.join(";")}`,
  tags: [],
  bestFor: catalogBestFor(category),
  note: "",
  popularity,
}));

export const FONT_COUNT = FONT_LIBRARY.length + catalogEntries.length;

FONT_LIBRARY.push(...catalogEntries);

/** Full CSS font stack for a ref — selected fonts and graceful fallbacks. */
export function fontStack(ref: Pick<FontRef, "family" | "category">): string {
  return `'${ref.family}', ${CATEGORY_FALLBACK[ref.category]}`;
}

// ---------- runtime loading (Google Fonts, on demand) ----------

const loadedUrls = new Set<string>();
const requested = new Set<string>();

function loadUrl(url: string) {
  if (loadedUrls.has(url) || requested.has(url)) return;
  requested.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.onload = () => loadedUrls.add(url);
  document.head.appendChild(link);
}

/** Load a set of Google font entries (idempotent, batched per call). */
export function ensureFonts(entries: FontEntry[]) {
  const google = entries.filter((e) => e.source === "google");
  if (!google.length) return;
  // specs are ASCII-safe (family:axis@tuple,comma) — spaces become "+",
  // everything else stays literal because the css2 API expects it
  const spec = google.map((e) => `family=${e.gfSpec.replace(/\s/g, "+")}`).join("&");
  loadUrl(`https://fonts.googleapis.com/css2?${spec}&display=swap`);
}

/** Ensure the Google fonts behind a set of font refs are loaded. */
export function ensureFontsForRefs(refs: (FontRef | null | undefined)[]) {
  const entries = refs
    .filter((r): r is FontRef => !!r && r.source === "google")
    .map((r) => fontByFamily(r.family))
    .filter((e): e is FontEntry => !!e);
  ensureFonts(entries);
}

export function fontById(id: string): FontEntry | undefined {
  return FONT_LIBRARY.find((f) => f.id === id);
}
export function fontByFamily(family: string): FontEntry | undefined {
  return FONT_LIBRARY.find((f) => f.family === family);
}

export function searchFonts(query: string, category?: FontCategory): FontEntry[] {
  const q = query.trim().toLowerCase();
  return FONT_LIBRARY.filter((f) => {
    if (category && f.category !== category) return false;
    if (!q) return true;
    return (
      f.family.toLowerCase().includes(q) ||
      f.category.includes(q) ||
      f.tags.some((t) => t.includes(q)) ||
      f.note.toLowerCase().includes(q)
    );
  });
}

/** Heading candidates ranked for a personality; body candidates likewise. */
export function suggestFonts(personality: string[], bestFor: "heading" | "body"): FontEntry[] {
  const scored = FONT_LIBRARY.filter((f) => f.bestFor === bestFor || f.bestFor === "both").map((f) => ({
    f,
    score: f.tags.filter((t) => personality.includes(t)).length,
  }));
  return scored.sort((a, b) => b.score - a.score).map((s) => s.f);
}

// ---------- building the structured system ----------

export const DEFAULT_WEIGHTS: Record<FontCategory, number[]> = {
  serif: [400, 500, 600],
  sans: [400, 500, 600, 700],
  display: [400, 700],
  mono: [400, 700],
};

export function toFontRef(entry: FontEntry, weights?: number[]): FontRef {
  return {
    family: entry.family,
    source: entry.source,
    category: entry.category,
    availableWeights: entry.availableWeights,
    weights: weights?.filter((w) => entry.availableWeights.includes(w)) ??
      DEFAULT_WEIGHTS[entry.category].filter((w) => entry.availableWeights.includes(w)),
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Derive the full style ladder from hierarchy (base size × scale ratio). */
export function buildTypeStyles(
  heading: FontRef,
  body: FontRef,
  mono: FontRef,
  hierarchy: { baseSize: number; scale: number },
  weights: { display?: number; h1?: number; h2?: number; h3?: number } = {},
): TypeStyle[] {
  const { baseSize, scale } = hierarchy;
  const fit = (ref: FontRef, preferred: number) =>
    ref.weights.includes(preferred) ? preferred : ref.weights[ref.weights.length - 1];
  const px = (n: number) => {
    const lo = round(n * 0.88);
    return lo === n ? `${n}px` : `${lo}–${round(n)}px`;
  };
  return [
    { name: "Display", role: "display", fontKey: "heading", weight: weights.display ?? fit(heading, 500), sizePx: round(baseSize * scale ** 4), size: px(baseSize * scale ** 4), lineHeight: "1.02", letterSpacing: "-0.02em", sample: "Brand systems that scale" },
    { name: "H1", role: "heading", fontKey: "heading", weight: weights.h1 ?? fit(heading, 500), sizePx: round(baseSize * scale ** 3), size: px(baseSize * scale ** 3), lineHeight: "1.08", letterSpacing: "-0.015em", sample: "Your logo is the beginning" },
    { name: "H2", role: "heading", fontKey: "heading", weight: weights.h2 ?? fit(heading, 500), sizePx: round(baseSize * scale ** 2), size: px(baseSize * scale ** 2), lineHeight: "1.15", letterSpacing: "-0.01em", sample: "Everything your brand needs" },
    { name: "H3", role: "heading", fontKey: "heading", weight: weights.h3 ?? fit(heading, 600), sizePx: round(baseSize * scale), size: px(baseSize * scale), lineHeight: "1.25", letterSpacing: "0", sample: "Colour with intent" },
    { name: "Body Large", role: "body", fontKey: "body", weight: fit(body, 400), sizePx: round(baseSize * 1.125), size: px(baseSize * 1.125), lineHeight: "1.6", letterSpacing: "0", sample: "A complete, editable brand system built around your logo — structured, versioned and ready to use everywhere." },
    { name: "Body", role: "body", fontKey: "body", weight: fit(body, 400), sizePx: baseSize, size: `${baseSize}px`, lineHeight: "1.65", letterSpacing: "0", sample: "Tell us a little about your business and we'll turn your existing logo into a complete brand system." },
    { name: "Caption", role: "caption", fontKey: "body", weight: fit(body, 500), sizePx: round(baseSize * 0.8), size: `${round(baseSize * 0.8)}px`, lineHeight: "1.5", letterSpacing: "0.04em", sample: "FIG. 01 — CLEAR SPACE" },
    { name: "Label / Token", role: "label", fontKey: "mono", weight: fit(mono, 400), sizePx: round(baseSize * 0.72), size: `${round(baseSize * 0.72)}px`, lineHeight: "1.4", letterSpacing: "0.12em", sample: "#E54B32 / PRIMARY" },
  ];
}

export interface TypeSelection {
  headingId: string;
  bodyId: string;
  monoId: string;
  note?: string;
  hierarchy?: { baseSize: number; scale: number };
}

export function buildTypography(sel: TypeSelection): TypographySystem {
  const h = fontById(sel.headingId) ?? FONT_LIBRARY[0];
  const b = fontById(sel.bodyId) ?? FONT_LIBRARY.find((f) => f.id === "inter")!;
  const m = fontById(sel.monoId) ?? FONT_LIBRARY.find((f) => f.id === "space-mono")!;
  const heading = toFontRef(h);
  const body = toFontRef(b);
  const mono = toFontRef(m);
  const hierarchy = sel.hierarchy ?? { baseSize: 16, scale: 1.333 };
  return {
    heading,
    body,
    mono,
    note: sel.note ?? `${h.family} carries the voice; ${b.family} does the reading; ${m.family} labels the system.`,
    styles: buildTypeStyles(heading, body, mono, hierarchy),
    hierarchy,
    ownFonts: null,
  };
}

/** Resolve the font ref a style draws from. */
export function styleFont(typo: TypographySystem, s: TypeStyle): FontRef {
  return s.fontKey === "heading" ? typo.heading : s.fontKey === "body" ? typo.body : typo.mono;
}

/** True when heading and body resolve to the same family (weight-based hierarchy). */
export function isSingleFamily(typo: TypographySystem): boolean {
  const own = (r: FontRef) => (r.source === "custom" ? r.family.toLowerCase() : r.family);
  return own(typo.heading) === own(typo.body);
}

// ---------- legacy migration ----------
// Brand rows saved before the structured-token typography refactor hold
// { headingFont, bodyFont, monoFont, styles: [{ font, … }] }. Upgrade on read.

export function normalizeTypography(input: unknown): TypographySystem {
  const t = input as Partial<TypographySystem> & {
    headingFont?: string;
    bodyFont?: string;
    monoFont?: string;
    styles?: (TypeStyle & { font?: string })[];
  } | null | undefined;
  if (t && typeof t === "object" && t.heading && t.body && t.mono && Array.isArray(t.styles)) {
    const hierarchy = t.hierarchy ?? { baseSize: 16, scale: 1.333 };
    const fix = (ref: FontRef): FontRef =>
      ref && ref.weights?.length ? ref : ref
        ? { ...ref, weights: DEFAULT_WEIGHTS[ref.category ?? "sans"].filter((w) => (ref.availableWeights ?? [400, 700]).includes(w)) }
        : ref;
    const styles = t.styles.map((s) =>
      s.sizePx ? s : {
        ...s,
        sizePx: 16,
        fontKey: s.fontKey ?? (/^(Body|Caption)/.test(s.name) ? "body" : s.name === "Label / Token" ? "mono" : "heading"),
      },
    );
    return { ...t, heading: fix(t.heading), body: fix(t.body), mono: fix(t.mono), hierarchy, styles, ownFonts: t.ownFonts ?? null } as TypographySystem;
  }
  // legacy shape
  const legacy = t as { headingFont?: string; bodyFont?: string; monoFont?: string; note?: string } | undefined;
  const hEntry = fontByFamily(legacy?.headingFont ?? "Fraunces") ?? FONT_LIBRARY[0];
  const bEntry = fontByFamily(legacy?.bodyFont ?? "Inter") ?? FONT_LIBRARY.find((f) => f.id === "inter")!;
  const mEntry = fontByFamily(legacy?.monoFont ?? "Space Mono") ?? FONT_LIBRARY.find((f) => f.id === "space-mono")!;
  const built = buildTypography({ headingId: hEntry.id, bodyId: bEntry.id, monoId: mEntry.id });
  return { ...built, note: legacy?.note ?? built.note };
}
