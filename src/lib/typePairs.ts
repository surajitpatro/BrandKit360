/**
 * Curated typography pairings — quick-picks over the font library.
 * Each pair references library ids, so selecting one resolves to real,
 * loadable Google Fonts with structured weights (§10).
 */
import type { TypographySystem } from "../../contracts/brand";
import { buildTypography } from "./fontLibrary";

export interface TypePair {
  id: string;
  label: string;
  affinities: string[];
  headingId: string;
  bodyId: string;
  monoId: string;
  note: string;
  build: () => TypographySystem;
}

export const TYPE_PAIRS: TypePair[] = [
  {
    id: "editorial",
    label: "Editorial serif — authority with warmth",
    affinities: ["premium", "elegant", "traditional", "trustworthy"],
    headingId: "fraunces",
    bodyId: "inter",
    monoId: "space-mono",
    note: "A modern editorial serif for headlines against a neutral grotesque — classic publishing discipline for brands that want authority without coldness.",
    build: () => buildTypography({ headingId: "fraunces", bodyId: "inter", monoId: "space-mono", note: "A modern editorial serif for headlines against a neutral grotesque — classic publishing discipline for brands that want authority without coldness." }),
  },
  {
    id: "grotesque",
    label: "Modern grotesque — clean and direct",
    affinities: ["modern", "minimal", "professional", "innovative"],
    headingId: "inter",
    bodyId: "inter",
    monoId: "space-mono",
    note: "One confident grotesque across the system with weight and size doing the hierarchy work — the typographic equivalent of a grid.",
    build: () => buildTypography({ headingId: "inter", bodyId: "inter", monoId: "space-mono", note: "One confident grotesque across the system with weight and size doing the hierarchy work — the typographic equivalent of a grid." }),
  },
  {
    id: "geometric",
    label: "Geometric humanist — friendly precision",
    affinities: ["friendly", "playful", "energetic", "modern"],
    headingId: "figtree",
    bodyId: "inter",
    monoId: "space-mono",
    note: "Rounded geometry in the headlines keeps the brand open and approachable while the body stays thoroughly readable.",
    build: () => buildTypography({ headingId: "figtree", bodyId: "inter", monoId: "space-mono", note: "Rounded geometry in the headlines keeps the brand open and approachable while the body stays thoroughly readable." }),
  },
  {
    id: "contrast",
    label: "High contrast — dramatic display",
    affinities: ["bold", "premium", "energetic", "innovative"],
    headingId: "playfair",
    bodyId: "inter",
    monoId: "space-mono",
    note: "Dramatic thick–thin display contrast for brands that need to be noticed first and read second; restrained body keeps it usable.",
    build: () => buildTypography({ headingId: "playfair", bodyId: "inter", monoId: "space-mono", note: "Dramatic thick–thin display contrast for brands that need to be noticed first and read second; restrained body keeps it usable." }),
  },
  {
    id: "technical",
    label: "Technical mono-accent — engineered voice",
    affinities: ["innovative", "modern", "minimal", "bold"],
    headingId: "space-grotesk",
    bodyId: "inter",
    monoId: "jetbrains",
    note: "A tech-inflected grotesque with an engineering-grade mono for labels and data — precision as personality.",
    build: () => buildTypography({ headingId: "space-grotesk", bodyId: "inter", monoId: "jetbrains", note: "A tech-inflected grotesque with an engineering-grade mono for labels and data — precision as personality." }),
  },
  {
    id: "heritage",
    label: "Heritage book — lasting craft",
    affinities: ["traditional", "trustworthy", "elegant", "professional"],
    headingId: "eb-garamond",
    bodyId: "source-serif",
    monoId: "ibm-plex-mono",
    note: "Book-tested serifs front to back — for brands whose credibility is accumulated, not announced.",
    build: () => buildTypography({ headingId: "eb-garamond", bodyId: "source-serif", monoId: "ibm-plex-mono", note: "Book-tested serifs front to back — for brands whose credibility is accumulated, not announced." }),
  },
];
