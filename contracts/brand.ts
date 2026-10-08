/**
 * BrandKit360 shared contracts — brand system data model + entitlement architecture.
 * Used by the frontend brand generator and the backend enforcement layer.
 */

// ---------- Entitlements ----------

export const ENTITLEMENTS = [
  "brand_guidelines",
  "brand_system",
  "figma_export",
  "brand_portal",
  "templates",
  "brand_checker",
  "ai_studio",
  "advanced_figma",
  "ai_brand_director",
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];

export const PLAN_ENTITLEMENTS: Record<string, Entitlement[]> = {
  starter: [],
  guidelines: ["brand_guidelines"],
  system: [
    "brand_guidelines",
    "brand_system",
    "figma_export",
    "brand_portal",
  ],
  system_pro: [
    "brand_guidelines",
    "brand_system",
    "figma_export",
    "brand_portal",
    "templates",
    "brand_checker",
    "ai_studio",
    "advanced_figma",
    "ai_brand_director",
  ],
};

// ---------- Colour ----------

export interface BrandColor {
  name: string;
  hex: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background" | "text";
  usage: string;
}

// ---------- Typography ----------
// Structured design tokens. Fonts reference a source-aware library
// (Google Fonts today; Adobe Fonts and custom uploads slot in as new sources).

export type FontSource = "google" | "adobe" | "custom";
export type FontCategory = "serif" | "sans" | "display" | "mono";

export interface FontRef {
  family: string;
  source: FontSource;
  category: FontCategory;
  /** weights the brand actually uses (subset of availableWeights) */
  weights: number[];
  availableWeights: number[];
}

export type TypeRole = "display" | "heading" | "body" | "caption" | "label";

export interface TypeStyle {
  name: string;
  role: TypeRole;
  /** which font slot this style draws from */
  fontKey: "heading" | "body" | "mono";
  weight: number;
  /** numeric size in px — the single source from which `size` is derived */
  sizePx: number;
  /** display string, e.g. "44–56px" — derived from hierarchy, never edited directly */
  size: string;
  lineHeight: string;
  letterSpacing: string;
  sample: string;
}

export interface TypeHierarchy {
  baseSize: number; // body size in px
  scale: number; // ratio between levels (1.2 = minor third … 1.5)
}

export interface TypographySystem {
  heading: FontRef;
  body: FontRef;
  mono: FontRef;
  note: string;
  styles: TypeStyle[];
  hierarchy: TypeHierarchy;
  /** set when the owner declared "I already have my brand fonts" */
  ownFonts: {
    headingName: string;
    bodyName: string;
    licenseNote: string;
  } | null;
}

// ---------- Brand DNA ----------

export interface BrandDNA {
  essence: string;
  positioning: string;
  audience: string;
  promise: string;
  personality: string[];
  toneOfVoice: string;
  visualDirection: string;
  keywords: string[];
}

// ---------- Sub-systems ----------

export interface LogoSystem {
  clearSpace: string;
  minSize: string;
  backgrounds: string;
  incorrect: string[];
}

export interface GraphicLanguage {
  shapes: string;
  patterns: string;
  devices: string;
  imageTreatment: string;
}

export interface PhotographyDirection {
  subject: string;
  lighting: string;
  composition: string;
  colour: string;
  people: string;
  avoid: string;
}

export interface VoiceSystem {
  tone: string;
  vocabulary: string;
  principles: string[];
  dos: string[];
  donts: string[];
  headlines: string[];
  ctas: string[];
}

export interface LayoutSystem {
  grid: string;
  spacing: string;
  margins: string;
  columns: string;
}

// ---------- Design tokens ----------

export interface DesignTokens {
  color: Record<string, string>;
  font: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
}

// ---------- Full brand system ----------

export interface BrandSystem {
  version: number;
  dna: BrandDNA;
  colors: BrandColor[];
  typography: TypographySystem;
  logo: LogoSystem;
  graphics: GraphicLanguage;
  photography: PhotographyDirection;
  voice: VoiceSystem;
  layout: LayoutSystem;
  tokens: DesignTokens;
  applications: string[];
  rules: { do: string[]; dont: string[] };
}

export interface BrandMeta {
  business: string;
  audienceTags: string[];
  personality: string[];
  usage: string[];
  admired: string;
  avoid: string;
  visualDirection: "retained" | "refined";
}

export interface BrandData {
  brand: {
    name: string;
    business: string;
    audience: string[];
    positioning: string;
  };
  dna: BrandDNA;
  personality: BrandMeta["personality"];
  essence: string;
  voice: VoiceSystem;
  visual_direction: { summary: string; paletteFamily: string; typeMood: string };
  logo: LogoSystem & { assetKey: string | null; fileName: string | null };
  colors: { list: BrandColor[] };
  typography: TypographySystem;
  graphics: GraphicLanguage;
  photography: PhotographyDirection;
  illustration: { style: string; treatment: string; complexity: string };
  iconography: { style: string; corners: string; grid: string };
  layout: LayoutSystem;
  applications: string[];
  tokens: DesignTokens;
  rules: { do: string[]; dont: string[] };
  locked: string[];
  meta: BrandMeta;
}

// ---------- Plans ----------

export interface PlanDeliverable {
  label: string;
  detail?: string;
}

export interface PlanInfo {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  comparePrice: number | null;
  badge: string | null;
  deliverables: PlanDeliverable[];
  corePromise: string;
  whoFor: string;
  result: string;
  active: boolean;
  sortOrder: number;
}

export const DEFAULT_PLANS: Omit<PlanInfo, "id">[] = [
  {
    slug: "starter",
    name: "STARTER",
    tagline: "For anyone who wants to build a brand before committing.",
    description: "Free starter",
    price: 0,
    currency: "USD",
    comparePrice: null,
    badge: null,
    deliverables: [
      { label: "Brand DNA" },
      { label: "Logo & Colour System" },
      { label: "Typography" },
      { label: "Live Brand Preview" },
      { label: "1 brand system" },
      { label: "Basic editing" },
    ],
    corePromise: "Start free — build one brand system and upgrade when it grows.",
    whoFor: "Anyone who wants to test-drive BrandKit360 before buying.",
    result: "A working brand system with one brand, live preview and basic editing.",
    active: true,
    sortOrder: 0,
  },
  {
    slug: "guidelines",
    name: "GUIDELINES",
    tagline: "For businesses that need a professional brand book.",
    description: "Professional brand book",
    price: 9900,
    currency: "USD",
    comparePrice: null,
    badge: null,
    deliverables: [
      { label: "Brand DNA" },
      { label: "Logo Guidelines" },
      { label: "Colour System" },
      { label: "Typography" },
      { label: "Brand Personality" },
      { label: "Photography Direction" },
      { label: "Basic Graphic Language" },
      { label: "Brand Do's & Don'ts" },
      { label: "Professional Brand Guidelines PDF" },
      { label: "Brand Asset Downloads" },
    ],
    corePromise: "A professional brand book built from your existing logo.",
    whoFor: "Businesses that need a professional brand book.",
    result: "A premium, exportable brand guidelines document.",
    active: true,
    sortOrder: 1,
  },
  {
    slug: "system",
    name: "SYSTEM",
    tagline: "For businesses that want a complete, editable brand system.",
    description: "Complete editable brand system",
    price: 24900,
    currency: "USD",
    comparePrice: null,
    badge: "MOST POPULAR",
    deliverables: [
      { label: "Everything in Guidelines" },
      { label: "Complete Design System" },
      { label: "Advanced Colour System" },
      { label: "Typography System" },
      { label: "Graphic Language" },
      { label: "Iconography" },
      { label: "Layout System" },
      { label: "Design Tokens" },
      { label: "Editable Brand System" },
      { label: "Brand Portal" },
      { label: "Version History" },
      { label: "Figma-ready System" },
      { label: "Structured Exports" },
    ],
    corePromise: "A complete, editable brand system you can actually use.",
    whoFor: "Businesses that want a complete, editable brand system.",
    result: "A living, editable system — guidelines, tokens, portal, Figma-ready output.",
    active: true,
    sortOrder: 2,
  },
  {
    slug: "system_pro",
    name: "SYSTEM PRO",
    tagline: "For businesses that want complete brand infrastructure.",
    description: "Complete brand infrastructure",
    price: 49900,
    currency: "USD",
    comparePrice: null,
    badge: null,
    deliverables: [
      { label: "Everything in System" },
      { label: "Advanced Figma System" },
      { label: "Figma Variables" },
      { label: "Components" },
      { label: "Templates" },
      { label: "Social Media Templates" },
      { label: "Presentation Templates" },
      { label: "Brand Checker" },
      { label: "Advanced Applications" },
      { label: "AI Studio" },
      { label: "AI Brand Director" },
      { label: "Advanced Brand Management" },
    ],
    corePromise: "A complete brand infrastructure built to scale.",
    whoFor: "Businesses that want complete brand infrastructure.",
    result: "Brand infrastructure with components, templates, checking and AI assistance.",
    active: true,
    sortOrder: 3,
  },
];

export function formatPrice(price: number, currency: string): string {
  const major = price / 100;
  try {
    const whole = Number.isInteger(major);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString()}`;
  }
}
