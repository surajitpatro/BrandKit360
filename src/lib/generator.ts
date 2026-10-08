/**
 * BrandKit360 deterministic brand-system generator.
 * Turns questionnaire answers + visual direction into a complete, structured,
 * editable BrandData object (the source of truth — the guidelines are just an output).
 */
import type { BrandColor, BrandData, BrandDNA } from "../../contracts/brand";
import { PALETTE_FAMILIES, familyById } from "./palettes";
import { TYPE_PAIRS } from "./typePairs";
import { logoPalette, ROLE_ORDER } from "./logoPalette";
import { fontStack, buildTypography } from "./fontLibrary";

export interface WizardAnswers {
  brandName: string;
  business: string;
  audience: string[];
  personality: string[];
  usage: string[];
  admired: string;
  avoid: string;
  paletteFamilyId?: string;
  /** "logo" — build the palette from extracted logo colours; "curated" — a suggested direction */
  colorMode?: "logo" | "curated";
  /** role → hex overrides applied on top of whichever palette was chosen */
  customColors?: Record<string, string>;
  typePairId?: string;
  /** hand-picked fonts from the library (heading/body/mono ids) */
  customType?: { headingId: string; bodyId: string; monoId: string };
  detectedColors?: string[];
  logoAssetKey?: string | null;
  logoFileName?: string | null;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const PERSONALITY_COPY: Record<string, { essence: string; tone: string; vocab: string; principle: string }> = {
  premium: { essence: "considered quality", tone: "assured, precise, never loud", vocab: "crafted, refined, signature, enduring", principle: "Understate. Let quality carry the voice." },
  modern: { essence: "contemporary clarity", tone: "crisp, current, efficient", vocab: "build, system, forward, today", principle: "Say the new thing simply." },
  friendly: { essence: "genuine warmth", tone: "open, conversational, helpful", vocab: "welcome, together, easy, human", principle: "Write like a person, not a brochure." },
  bold: { essence: "confident conviction", tone: "direct, punchy, unapologetic", vocab: "lead, decisive, own it, unmistakable", principle: "Short sentences. Strong verbs. No hedging." },
  minimal: { essence: "essential simplicity", tone: "quiet, spare, exact", vocab: "only, enough, clear, calm", principle: "Remove until it breaks, then put one thing back." },
  playful: { essence: "generous delight", tone: "light, witty, warm", vocab: "spark, twist, joy, surprise", principle: "Earn the smile — never force it." },
  elegant: { essence: "poised refinement", tone: "graceful, composed, cultured", vocab: "composed, heritage, grace, detail", principle: "Grace is restraint practiced consistently." },
  professional: { essence: "dependable expertise", tone: "clear, credible, measured", vocab: "proven, precise, accountable, trusted", principle: "Accuracy first. Adjectives last." },
  innovative: { essence: "restless invention", tone: "curious, optimistic, precise", vocab: "prototype, rethink, next, possible", principle: "Describe the future in present tense." },
  trustworthy: { essence: "earned confidence", tone: "honest, steady, transparent", vocab: "straightforward, verified, consistent, plain-spoken", principle: "Say what you know. Flag what you don't." },
  energetic: { essence: "momentum", tone: "propulsive, upbeat, vivid", vocab: "go, momentum, spark, now", principle: "Rhythm in the sentence, energy in the verb." },
  traditional: { essence: "lasting craft", tone: "measured, respectful, assured", vocab: "established, time-honoured, craft, legacy", principle: "Respect the past tense; write in the present." },
};

const CATEGORY_GUESS: [RegExp, string][] = [
  [/food|cafe|restaurant|bakery|coffee|kitchen|meal/i, "food & hospitality"],
  [/tech|software|app|ai|data|platform|digital/i, "technology"],
  [/design|studio|creative|agency|brand/i, "creative services"],
  [/fitness|health|wellness|yoga|clinic|care/i, "health & wellness"],
  [/finance|invest|capital|account|tax|bank/i, "financial services"],
  [/fashion|style|cloth|apparel|wear/i, "fashion & apparel"],
  [/education|course|school|learn|tutor/i, "education"],
  [/real|estate|property|home|interior|build|architect/i, "property & spaces"],
  [/travel|tour|stay|hotel|trip/i, "travel & experiences"],
  [/eco|green|sustain|organic|farm/i, "sustainability"],
  [/law|legal|consult|advisor/i, "professional services"],
  [/market|retail|shop|store|commerce|sell/i, "retail & commerce"],
];

const USAGE_APPLICATIONS: Record<string, string> = {
  website: "Website — hero sections, navigation and page systems",
  "social media": "Social media — profile assets, post templates, story formats",
  packaging: "Packaging — labels, boxes and unboxing moments",
  print: "Print — stationery, brochures and collateral",
  advertising: "Advertising — campaign layouts and ad units",
  presentations: "Presentations — title slides, agendas and data layouts",
  signage: "Signage — wayfinding, storefront and environmental graphics",
  events: "Events — backdrops, badges and event collateral",
  "mobile app": "Mobile app — iconography, screens and UI components",
  product: "Product — interfaces, onboarding and in-product moments",
};

function guessCategory(business: string): string {
  for (const [re, cat] of CATEGORY_GUESS) if (re.test(business)) return cat;
  return "its field";
}

function pickPalette(a: WizardAnswers) {
  if (a.paletteFamilyId) return familyById(a.paletteFamilyId);
  let best = PALETTE_FAMILIES[0];
  let bestScore = -1;
  for (const f of PALETTE_FAMILIES) {
    const score = f.affinities.filter((t) => a.personality.includes(t)).length;
    const tiebreak = (score === bestScore && hashString(a.brandName + f.id) % 2 === 0);
    if (score > bestScore || tiebreak) {
      best = f;
      bestScore = score;
    }
  }
  return best;
}

function pickTypePair(a: WizardAnswers) {
  if (a.customType) {
    return {
      id: "custom",
      label: "Custom selection from the font library",
      affinities: [],
      note: "Hand-picked heading and body from the font library.",
      build: () => buildTypography(a.customType!),
    };
  }
  if (a.typePairId) return TYPE_PAIRS.find((t) => t.id === a.typePairId) ?? TYPE_PAIRS[0];
  let best = TYPE_PAIRS[0];
  let bestScore = -1;
  for (const t of TYPE_PAIRS) {
    const score = t.affinities.filter((x) => a.personality.includes(x)).length;
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

function buildDNA(a: WizardAnswers, paletteLabel: string, typeLabel: string): BrandDNA {
  const traits = a.personality.slice(0, 4);
  const copies = traits.map((t) => PERSONALITY_COPY[t] ?? PERSONALITY_COPY.professional);
  const category = guessCategory(a.business);
  const audiencePhrase = a.audience.length
    ? a.audience.slice(0, 3).join(", ")
    : "the people it serves";
  const essence = `Where ${category} brands choose between looking good and working well, ${a.brandName} holds both — built on ${copies.map((c) => c.essence).join(", ")}.`;
  const positioning = `For ${audiencePhrase}, ${a.brandName} is the ${category} brand that delivers with ${copies[0]?.essence ?? "clarity"} — ${a.business.replace(/\.$/, "")}.`;
  const promise = `Every touchpoint — from the first impression to the hundredth — will feel unmistakably ${traits[0] ?? "considered"}: consistent in look, clear in voice, and confident in intent.`;
  const toneOfVoice = `${copies.map((c) => c.tone).join("; ")}. Vocabulary leans on ${copies[0]?.vocab ?? "plain, confident language"}.`;
  const visualDirection = `${paletteLabel}. Typography: ${typeLabel}. Composition favours structured grids, deliberate whitespace and one accent colour doing the talking.`;
  return {
    essence,
    positioning,
    audience: `${a.brandName} speaks to ${audiencePhrase} — people who value ${traits.slice(0, 2).join(" and ") ?? "clarity"} and notice when details are done properly.`,
    promise,
    personality: traits,
    toneOfVoice,
    visualDirection,
    keywords: [...new Set([...traits, category.split(" ")[0], "consistent", "considered"])].slice(0, 6),
  };
}

export function generateBrandSystem(a: WizardAnswers): BrandData {
  const family = pickPalette(a);
  const pair = pickTypePair(a);
  const fromLogo = a.colorMode === "logo" && (a.detectedColors?.length ?? 0) >= 2;
  let colors: BrandColor[] = fromLogo
    ? logoPalette(a.detectedColors!)
    : family.colors.map((col, i) => ({ ...col, role: ROLE_ORDER[i] }));
  if (a.customColors) {
    colors = colors.map((c) =>
      a.customColors![c.role] ? { ...c, hex: a.customColors![c.role], name: c.name + " · custom" } : c,
    );
  }
  const paletteLabel = fromLogo ? "Your logo colours, organised into a system" : family.label;
  const dna = buildDNA(a, paletteLabel, pair.label);
  const usageKeys = a.usage.length ? a.usage : ["website", "social media", "presentations"];
  const applications = usageKeys.map((u) => USAGE_APPLICATIONS[u.toLowerCase()] ?? `${u} — applied brand layouts`);
  const traits = a.personality;

  const has = (...ts: string[]) => ts.some((t) => traits.includes(t));

  const photography = has("premium", "elegant", "minimal")
    ? {
        subject: "Considered still lifes, architectural details and the product in context — nothing staged, nothing noisy.",
        lighting: "Soft directional light with deep, calm shadows; golden-hour warmth or controlled studio diffusion.",
        composition: "Generous negative space; subjects placed on a clear grid with room to breathe.",
        colour: "Muted and true to the palette — desaturated support for the accent colour.",
        people: "Real, unposed moments; hands at work, faces in profile, never stock-smiling at camera.",
        avoid: "Cluttered scenes, harsh flash, oversaturated filters, generic stock imagery.",
      }
    : has("playful", "friendly", "energetic")
    ? {
        subject: "People in motion, product in use, small moments of delight caught mid-action.",
        lighting: "Bright, natural, high-key light with vivid colour energy.",
        composition: "Dynamic diagonals and off-centre framing; crops that feel caught, not posed.",
        colour: "Saturated and sunny, echoing the accent colour in real-world details.",
        people: "Genuine expressions, real customers, candid over corporate.",
        avoid: "Stiff boardroom scenes, dim moody stock, anything that feels banked rather than lived.",
      }
    : {
        subject: "The product doing its job, the team behind it, and the environment it belongs to.",
        lighting: "Clean and even with crisp definition; believable over dramatic.",
        composition: "Structured on the brand grid — alignment you can feel even in photography.",
        colour: "True-to-life with subtle cooling toward the primary palette.",
        people: "Competent and approachable — people mid-task rather than posed at camera.",
        avoid: "Clichéd handshake stock, fake offices, heavy vignettes.",
      };

  const graphics = has("bold", "energetic", "playful")
    ? {
        shapes: "Confident geometric blocks — squares and half-circles used at large scale.",
        patterns: "High-contrast repeating tiles derived from the logo's strongest angle.",
        devices: "A single diagonal cut used to divide panels and carry imagery.",
        imageTreatment: "Duotone in primary and accent; hard crops; no drop shadows.",
      }
    : has("minimal", "modern", "innovative")
    ? {
        shapes: "Thin rules, precise rectangles and occasional circles used sparingly.",
        patterns: "Hairline grids and dot matrices — structure as ornament.",
        devices: "Whitespace itself; numbers and labels set in the mono face as graphic elements.",
        imageTreatment: "Full-bleed with a consistent grade; overlays in primary at 8–12% opacity.",
      }
    : {
        shapes: "Classic containers — framed panels, thin double rules, restrained corners.",
        patterns: "Subtle textile-like repeats in the neutral tone; pattern never above 10% contrast.",
        devices: "A consistent corner tick and generous margins as the signature frame.",
        imageTreatment: "Warm, softly graded photography inside structured frames.",
      };

  const voice = {
    tone: dna.toneOfVoice,
    vocabulary: copies0(a).vocab,
    principles: a.personality.slice(0, 4).map((t) => PERSONALITY_COPY[t]?.principle ?? "Be clear."),
    dos: [
      "Lead with the benefit, follow with the detail.",
      "Keep sentences short enough to say out loud.",
      `Use "${a.brandName}" naturally — the name carries weight when it's not repeated. `,
      "Prefer concrete numbers and verbs over adjectives.",
    ],
    donts: [
      "Don't use jargon the audience wouldn't say themselves.",
      "Don't stack more than one exclamation mark per page.",
      a.avoid ? `Avoid: ${a.avoid}` : "Don't imitate competitors' voice to chase trends.",
      "Don't make claims the product can't back.",
    ],
    headlines: [
      `${a.brandName} — ${copies0(a).essence}, delivered.`,
      "Built once. Used everywhere.",
      "The details are the brand.",
    ],
    ctas: has("premium", "elegant")
      ? ["Discover the collection", "Request an introduction", "View the work"]
      : has("bold", "energetic")
      ? ["Start now", "Get yours", "Let's go"]
      : ["Get started", "See how it works", "Talk to us"],
  };

  function copies0(x: WizardAnswers) {
    return PERSONALITY_COPY[x.personality[0]] ?? PERSONALITY_COPY.professional;
  }

  const typo = pair.build();

  const tokens = {
    color: {
      "color-primary": colors[0].hex,
      "color-secondary": colors[1].hex,
      "color-accent": colors[2].hex,
      "color-neutral": colors[3].hex,
      "color-background": colors[4].hex,
      "color-text": colors[5].hex,
    },
    font: {
      "font-heading": fontStack(typo.heading),
      "font-body": fontStack(typo.body),
      "font-mono": fontStack(typo.mono),
      "font-heading-family": typo.heading.family,
      "font-body-family": typo.body.family,
      "font-heading-weight": String(typo.heading.weights[0] ?? 400),
    },
    spacing: {
      "space-1": "4px", "space-2": "8px", "space-3": "16px", "space-4": "24px",
      "space-5": "32px", "space-6": "48px", "space-7": "64px", "space-8": "96px",
    },
    radius: { "radius-s": "2px", "radius-m": "6px", "radius-l": "12px" },
    shadow: {
      "shadow-s": "0 1px 2px rgba(8,45,79,0.08)",
      "shadow-m": "0 8px 24px rgba(8,45,79,0.12)",
    },
  };

  return {
    brand: {
      name: a.brandName,
      business: a.business,
      audience: a.audience,
      positioning: dna.positioning,
    },
    dna,
    personality: traits,
    essence: dna.essence,
    voice,
    visual_direction: { summary: dna.visualDirection, paletteFamily: fromLogo ? "logo" : family.id, typeMood: pair.id },
    logo: {
      assetKey: a.logoAssetKey ?? null,
      fileName: a.logoFileName ?? null,
      clearSpace: "Keep clear space equal to the height of the logo's cap-height on all sides.",
      minSize: "Never reproduce the logo smaller than 96px wide in digital or 24mm in print.",
      backgrounds: "Use the primary or background colour. On photography, place inside a panel of background colour.",
      incorrect: [
        "Do not recolour the logo outside the approved palette.",
        "Do not stretch, rotate or add effects (shadows, outlines, gradients).",
        "Do not place the logo on clashing or low-contrast backgrounds.",
        "Do not rearrange or resize the logo's internal elements.",
      ],
    },
    colors: { list: colors },
    typography: typo,
    graphics,
    photography,
    illustration: {
      style: has("playful", "friendly") ? "Flat, characterful spot illustration with warm geometry" : has("premium", "elegant") ? "Fine-line, single-weight illustration with editorial restraint" : "Precise geometric illustration aligned to the icon grid",
      treatment: has("bold", "energetic") ? "Bold fills in primary and accent; no outlines" : "Thin strokes or duotone fills from the brand palette",
      complexity: has("minimal") ? "Minimal — one idea per illustration" : "Moderate — layered scenes allowed, clutter never",
    },
    iconography: {
      style: has("premium", "elegant") ? "1.5px stroke, rounded terminals" : has("bold", "energetic") ? "2px stroke, filled where emphasis is needed" : "1.5–2px stroke, consistent geometric construction",
      corners: has("playful", "friendly") ? "Generously rounded (radius 2px)" : "Slightly rounded (radius 1px)",
      grid: "24px grid, 2px safe area, optical corrections for circular forms",
    },
    layout: {
      grid: "12-column grid, 72px max column width, 24px gutters (scaled down on tablet/mobile).",
      spacing: "Spacing scale of 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96 — never arbitrary values.",
      margins: "96px desktop, 48px tablet, 20px mobile.",
      columns: "12 on desktop, 8 on tablet, 4 on mobile.",
    },
    applications,
    tokens,
    rules: {
      do: [
        "Use the primary colour for structure and the accent for action.",
        "Set headlines in the heading face, everything else in the body face.",
        "Keep one strong idea per layout.",
        "Apply the spacing scale relentlessly.",
      ],
      dont: [
        "Don't introduce colours, fonts or effects outside the system.",
        "Don't centre long text; left-align for readability.",
        "Don't let the accent colour exceed roughly 10% of any composition.",
        ...(a.avoid ? [`Avoid: ${a.avoid}`] : []),
      ],
    },
    locked: [],
    meta: {
      business: a.business,
      audienceTags: a.audience,
      personality: traits,
      usage: a.usage,
      admired: a.admired,
      avoid: a.avoid,
      visualDirection: a.paletteFamilyId || a.typePairId || a.colorMode ? "refined" : "retained",
    },
  };
}

/** Client-side refinement presets for "Ask AI"-free environments (§11). */
export function nudgeDna(dna: BrandDNA, instruction: string): BrandDNA {
  const i = instruction.toLowerCase();
  const next = { ...dna, keywords: [...dna.keywords] };
  if (i.includes("premium") || i.includes("luxur")) {
    next.essence = dna.essence.replace(/delivers?/g, "curates");
    next.toneOfVoice = "Assured, composed and exact — fewer words, each one chosen. Vocabulary leans on crafted, signature, enduring.";
    if (!next.keywords.includes("refined")) next.keywords.push("refined");
  } else if (i.includes("approach") || i.includes("friendly") || i.includes("warm")) {
    next.toneOfVoice = "Warm, plain-spoken and generous — contractions welcome, jargon banned. Vocabulary leans on easy, together, human.";
    if (!next.keywords.includes("warm")) next.keywords.push("warm");
  } else if (i.includes("corporate") || i.includes("stiff") || i.includes("formal")) {
    next.toneOfVoice = "Direct and human — short sentences, active verbs, zero boardroom language. Vocabulary leans on plain, clear, honest.";
    next.essence = dna.essence.replace(/enterprise-grade|world-class/gi, "genuinely good");
    if (!next.keywords.includes("human")) next.keywords.push("human");
  } else if (i.includes("energetic") || i.includes("bold") || i.includes("dynamic")) {
    next.toneOfVoice = "Propulsive and vivid — rhythm in the sentence, energy in the verb, confidence without noise. Vocabulary leans on momentum, spark, now.";
    if (!next.keywords.includes("energetic")) next.keywords.push("energetic");
  } else if (i.includes("minimal") || i.includes("simple")) {
    next.toneOfVoice = "Spare and exact — remove until only the essential remains. Vocabulary leans on only, enough, clear.";
    if (!next.keywords.includes("essential")) next.keywords.push("essential");
  } else {
    next.visualDirection = dna.visualDirection + " (refined per request: " + instruction.slice(0, 80) + ")";
  }
  return next;
}

/** Regenerate a single palette from the same family logic with a different seed. */
export function regeneratePalette(a: WizardAnswers, currentFamilyId: string): BrandData["colors"] {
  const others = PALETTE_FAMILIES.filter((f) => f.id !== currentFamilyId);
  const next = others[hashString(a.brandName + currentFamilyId + Date.now()) % others.length];
  return {
    list: next.colors.map((col, i) => ({ ...col, role: ROLE_ORDER[i] })),
  };
}
