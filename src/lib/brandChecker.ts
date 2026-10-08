/**
 * Rules-based Brand Checker (§23) — objective design-system checks.
 * AI may add qualitative review later; objective checks never rely on AI.
 */
import type { BrandData } from "../../contracts/brand";
import { contrastRatio } from "./colorUtils";

export interface CheckResult {
  id: string;
  area: "colour" | "typography" | "logo" | "spacing" | "consistency" | "completeness";
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export function runBrandChecks(data: BrandData): CheckResult[] {
  const results: CheckResult[] = [];
  const colors = data.colors.list;
  const byRole = (role: string) => colors.find((c) => c.role === role);
  const primary = byRole("primary");
  const accent = byRole("accent");
  const bg = byRole("background");
  const text = byRole("text");

  const push = (r: Omit<CheckResult, "id">) =>
    results.push({ ...r, id: `c${results.length}` });

  // ---- Colour contrast ----
  if (text && bg) {
    const ratio = contrastRatio(text.hex, bg.hex);
    push({
      area: "colour",
      label: "Body text on background",
      status: ratio >= 4.5 ? "pass" : ratio >= 3 ? "warn" : "fail",
      detail: `Contrast ratio ${ratio.toFixed(2)}:1 (WCAG AA needs 4.5:1). ${ratio >= 4.5 ? "Readable everywhere." : ratio >= 3 ? "Acceptable for large text only." : "Fails accessibility — adjust text or background colour."}`,
    });
  }
  if (accent && bg) {
    const ratio = contrastRatio(accent.hex, bg.hex);
    push({
      area: "colour",
      label: "Accent on background",
      status: ratio >= 3 ? "pass" : "warn",
      detail: `Contrast ratio ${ratio.toFixed(2)}:1. The accent carries actions and links — it should stay clearly visible.`,
    });
  }
  if (primary && accent) {
    const tooClose = contrastRatio(primary.hex, accent.hex) < 1.6;
    push({
      area: "colour",
      label: "Primary vs accent distinctness",
      status: tooClose ? "warn" : "pass",
      detail: tooClose
        ? "Primary and accent are very close in tone — hierarchy between structure and action may blur."
        : "Primary and accent are clearly distinct; hierarchy reads well.",
    });
  }
  const dupes = colors.filter((c, i) => colors.findIndex((o) => o.hex.toLowerCase() === c.hex.toLowerCase()) !== i);
  push({
    area: "colour",
    label: "Duplicate colour values",
    status: dupes.length ? "warn" : "pass",
    detail: dupes.length
      ? `${dupes.length} duplicate value(s) in the palette — roles may not produce visible hierarchy.`
      : "Every role holds a distinct value.",
  });

  // ---- Typography ----
  const heading = data.typography.heading.family;
  const body = data.typography.body.family;
  push({
    area: "typography",
    label: "Typeface pairing",
    status: heading && body ? "pass" : "fail",
    detail: heading === body
      ? `Single family (${heading}) with weight-based hierarchy — disciplined and safe.`
      : `${heading} for display, ${body} for text — a clear editorial split.`,
  });
  const minWeights = [data.typography.heading, data.typography.body, data.typography.mono].filter((r) => r.weights.length >= 2).length;
  push({
    area: "typography",
    label: "Weight range",
    status: minWeights >= 2 ? "pass" : "warn",
    detail: minWeights >= 2
      ? "At least two font slots carry multiple weights — real hierarchy is possible."
      : "Most slots have a single weight; add weights so hierarchy doesn't depend on size alone.",
  });
  const hasDisplay = data.typography.styles.some((s) => s.name === "Display");
  const hasBody = data.typography.styles.some((s) => s.name === "Body");
  push({
    area: "typography",
    label: "Hierarchy completeness",
    status: hasDisplay && hasBody ? "pass" : "warn",
    detail: hasDisplay && hasBody
      ? "Display, headings and body styles are all defined."
      : "Some hierarchy levels are missing — regenerate or extend the type system.",
  });

  // ---- Logo ----
  push({
    area: "logo",
    label: "Logo asset attached",
    status: data.logo.assetKey ? "pass" : "warn",
    detail: data.logo.assetKey
      ? "Original logo file is stored with the system — exports and portal can use it."
      : "No logo file stored yet. Upload one so guidelines and exports show the real mark.",
  });
  push({
    area: "logo",
    label: "Usage rules defined",
    status: data.logo.incorrect.length >= 3 ? "pass" : "warn",
    detail: `${data.logo.incorrect.length} incorrect-usage rules documented; clear space: “${data.logo.clearSpace.slice(0, 60)}…”`,
  });

  // ---- Spacing / tokens consistency ----
  const spacings = Object.values(data.tokens.spacing);
  const consistent = spacings.every((v) => /^\d+px$/.test(v));
  push({
    area: "spacing",
    label: "Spacing token sanity",
    status: consistent ? "pass" : "fail",
    detail: consistent
      ? "All spacing tokens are pixel values on the scale."
      : "Some spacing tokens are not pixel values — dependent components may misalign.",
  });
  const tokenColorMatch = data.tokens.color["color-primary"] === primary?.hex &&
    data.tokens.color["color-accent"] === accent?.hex;
  push({
    area: "consistency",
    label: "Tokens match colour system",
    status: tokenColorMatch ? "pass" : "fail",
    detail: tokenColorMatch
      ? "Design tokens are in sync with the palette — change once, update everywhere is intact."
      : "Tokens have drifted from the palette. Re-save the colour system to resync.",
  });

  // ---- Completeness ----
  const fields: [string, string][] = [
    ["Brand essence", data.dna.essence],
    ["Positioning", data.dna.positioning],
    ["Brand promise", data.dna.promise],
    ["Tone of voice", data.dna.toneOfVoice],
    ["Photography direction", data.photography.subject],
    ["Graphic language", data.graphics.shapes],
  ];
  const empty = fields.filter(([, v]) => !v || v.trim().length < 8);
  push({
    area: "completeness",
    label: "System completeness",
    status: empty.length === 0 ? "pass" : "warn",
    detail: empty.length === 0
      ? "All strategic and directional fields are filled in."
      : `Fields needing attention: ${empty.map(([k]) => k).join(", ")}.`,
  });
  const lockedCount = data.locked.length;
  push({
    area: "consistency",
    label: "Brand lock coverage",
    status: lockedCount > 0 ? "pass" : "warn",
    detail: lockedCount
      ? `${lockedCount} element(s) locked — AI and regeneration will respect them.`
      : "Nothing is locked yet. Lock approved elements (logo, primary colour, typography) to protect them from accidental change.",
  });

  return results;
}
