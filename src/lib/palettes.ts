/**
 * Curated palette families. Each family is a complete, professionally
 * balanced colour system. Families carry personality affinities so the
 * generator picks a palette that matches the brand's chosen feel.
 */
import type { BrandColor } from "../../contracts/brand";

export interface PaletteFamily {
  id: string;
  label: string;
  affinities: string[]; // personality tags this family suits
  colors: Omit<BrandColor, "role">[]; // ordered: primary, secondary, accent, neutral, background, text
  rationale: string;
}

const c = (name: string, hex: string, usage: string) => ({ name, hex, usage });

export const PALETTE_FAMILIES: PaletteFamily[] = [
  {
    id: "harbour",
    label: "Harbour — deep navy & warm signal",
    affinities: ["professional", "trustworthy", "traditional", "premium"],
    colors: [
      c("Harbour Navy", "#0A2A4A", "Primary brand colour — headers, key surfaces, authority moments"),
      c("Slate Blue", "#3D5A80", "Secondary — supporting panels, diagrams, subdued emphasis"),
      c("Signal Vermilion", "#E54B32", "Accent — calls to action, highlights, moments of energy"),
      c("Mist Grey", "#E8E6E1", "Neutral — backgrounds, dividers, quiet structure"),
      c("Paper White", "#F7F6F2", "Background — the default canvas"),
      c("Ink Navy", "#0A2A4A", "Text — body copy on light surfaces"),
    ],
    rationale: "A trustworthy naval base with a single warm accent — classic brand architecture.",
  },
  {
    id: "atelier",
    label: "Atelier — ink black & gallery cream",
    affinities: ["premium", "elegant", "minimal", "traditional"],
    colors: [
      c("Gallery Black", "#141414", "Primary — wordmark, display type, high-contrast moments"),
      c("Bronze", "#A67C37", "Secondary — metallic warmth for premium details"),
      c("Oxide Red", "#B33A2B", "Accent — rare, deliberate emphasis"),
      c("Gallery Cream", "#EDE9E0", "Neutral — section backgrounds and framing"),
      c("Archival White", "#FAF8F4", "Background — exhibitions and editorial pages"),
      c("Charcoal", "#2A2A2A", "Text — refined body copy"),
    ],
    rationale: "Gallery discipline: near-monochrome with a bronze register, for brands that whisper luxury.",
  },
  {
    id: "meadow",
    label: "Meadow — botanical green & sun",
    affinities: ["friendly", "playful", "energetic", "trustworthy"],
    colors: [
      c("Forest", "#1E5631", "Primary — grounded, natural authority"),
      c("Sage", "#8FAE8B", "Secondary — soft supporting tone"),
      c("Sunbeam", "#F2A93B", "Accent — warmth, optimism, calls to action"),
      c("Linen", "#E9E4D7", "Neutral — natural fibres, calm backgrounds"),
      c("Milk", "#FBFAF5", "Background — light and breathable"),
      c("Deep Moss", "#173F26", "Text — rich, readable dark green"),
    ],
    rationale: "Organic and open — growth-oriented palettes for approachable brands.",
  },
  {
    id: "cobalt",
    label: "Cobalt — electric blue & coral pop",
    affinities: ["modern", "innovative", "energetic", "bold"],
    colors: [
      c("Cobalt", "#1F3BFF", "Primary — confident, digital-first blue"),
      c("Sky", "#7FA8FF", "Secondary — airy tech gradients"),
      c("Coral Pop", "#FF6B4A", "Accent — energetic highlights"),
      c("Cloud", "#E6EAF2", "Neutral — interface structure"),
      c("White", "#FFFFFF", "Background — crisp product canvas"),
      c("Midnight", "#101A3A", "Text — deep blue-black for readability"),
    ],
    rationale: "Digital-native energy — strong primaries tuned for screens and product UI.",
  },
  {
    id: "terracotta",
    label: "Terracotta — clay & olive",
    affinities: ["friendly", "traditional", "playful", "elegant"],
    colors: [
      c("Terracotta", "#C4572E", "Primary — warm, handcrafted earth tone"),
      c("Clay Rose", "#D9988A", "Secondary — soft blush support"),
      c("Olive", "#6B7A3A", "Accent — natural counterpoint"),
      c("Sand", "#EBE0D1", "Neutral — warm plaster backgrounds"),
      c("Linen White", "#FAF6EF", "Background — sunlit canvas"),
      c("Umber", "#4A3226", "Text — deep earth brown"),
    ],
    rationale: "Handmade warmth — ceramic and craft sensibilities for human brands.",
  },
  {
    id: "noir",
    label: "Noir — graphite & electric lime",
    affinities: ["bold", "modern", "innovative", "energetic"],
    colors: [
      c("Graphite", "#15181D", "Primary — dark power surfaces"),
      c("Steel", "#5B6472", "Secondary — industrial greys"),
      c("Volt", "#D8F34E", "Accent — electric highlight on dark"),
      c("Smoke", "#262B33", "Neutral — dark panels and hairlines"),
      c("Carbon", "#0C0E11", "Background — deepest canvas"),
      c("Off White", "#F2F2EF", "Text — inverted copy on dark"),
    ],
    rationale: "High-voltage contrast — for brands that lead with confidence and edge.",
  },
  {
    id: "bloom",
    label: "Bloom — plum & blush",
    affinities: ["elegant", "playful", "friendly", "premium"],
    colors: [
      c("Plum", "#5B2A4A", "Primary — rich, cultivated depth"),
      c("Mulberry", "#9C5C85", "Secondary — floral mid-tone"),
      c("Marigold", "#EFA13C", "Accent — bright, joyful punctuation"),
      c("Blush", "#F1E3E4", "Neutral — powder-soft backgrounds"),
      c("Ivory", "#FBF7F4", "Background — bridal canvas"),
      c("Aubergine", "#3A1B30", "Text — dense and dramatic"),
    ],
    rationale: "Cultivated colour — editorial florals for brands with taste and warmth.",
  },
  {
    id: "glacier",
    label: "Glacier — arctic teal & glacier blue",
    affinities: ["minimal", "modern", "trustworthy", "innovative"],
    colors: [
      c("Deep Teal", "#0F4C5C", "Primary — cool, precise authority"),
      c("Glacier", "#9CC5CF", "Secondary — icy transparency"),
      c("Amber Signal", "#E8A33D", "Accent — warm contrast in a cool field"),
      c("Frost", "#E3EBED", "Neutral — cold light structure"),
      c("Snow", "#F8FAFA", "Background — clinical clarity"),
      c("Abyss", "#0B2E38", "Text — deep sea ink"),
    ],
    rationale: "Cool precision — clinical, contemporary systems for technology and services.",
  },
];

export function familyById(id: string): PaletteFamily {
  return PALETTE_FAMILIES.find((f) => f.id === id) ?? PALETTE_FAMILIES[0];
}
