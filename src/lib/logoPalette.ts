/**
 * Logo-derived palettes and palette recommendation logic for the
 * Colour Direction step. Everything here is deterministic and explainable —
 * the "why" text names the actual questionnaire signals it used.
 */
import type { BrandColor } from "../../contracts/brand";
import { PALETTE_FAMILIES, type PaletteFamily } from "./palettes";
import { hashString } from "./generator";
import { contrastRatio } from "./colorUtils";

export const ROLE_ORDER: BrandColor["role"][] = ["primary", "secondary", "accent", "neutral", "background", "text"];

interface ColourInfo {
  hex: string;
  lum: number;
  sat: number;
}

function info(hex: string): ColourInfo {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { hex: "#" + h.toUpperCase(), lum, sat };
}

const FALLBACK_NEUTRAL = "#E8E6E1";
const FALLBACK_BACKGROUND = "#F7F6F2";
const FALLBACK_TEXT = "#1A1A1A";

/**
 * Turn colours extracted from the uploaded logo into a complete six-role
 * palette. `salt` rotates the assignment so "refresh" offers a genuinely
 * different reading of the same extracted colours.
 */
export function logoPalette(detected: string[], salt = 0): BrandColor[] {
  const infos = detected.map(info).sort((a, b) => b.lum - a.lum);
  if (!infos.length) return [];
  const rotated = salt ? [...infos.slice(salt % infos.length), ...infos.slice(0, salt % infos.length)] : infos;

  const background = rotated[0];
  const text = rotated[rotated.length - 1];
  const middle = rotated.slice(1, -1);
  const bySat = [...middle].sort((a, b) => b.sat - a.sat);
  const accent = bySat[0] ?? text;
  const primary = bySat[1] ?? middle[0] ?? text;
  const secondary = bySat[2] ?? middle[middle.length - 1] ?? primary;
  const neutral = middle.find((c) => c.sat < 0.12) ?? (background.sat < 0.12 ? background : { hex: FALLBACK_NEUTRAL, lum: 0.9, sat: 0.04 });

  const raw: { role: BrandColor["role"]; hex: string }[] = [
    { role: "primary", hex: primary.hex },
    { role: "secondary", hex: secondary.hex },
    { role: "accent", hex: accent.hex },
    { role: "neutral", hex: neutral.hex },
    { role: "background", hex: background.sat < 0.2 && background.lum > 0.8 ? background.hex : FALLBACK_BACKGROUND },
    { role: "text", hex: text.lum < 0.35 ? text.hex : FALLBACK_TEXT },
  ];

  const usage: Record<string, string> = {
    primary: "Primary brand colour — drawn from your logo; headers, key surfaces, authority moments",
    secondary: "Secondary — extracted from your logo; supporting panels and subdued emphasis",
    accent: "Accent — the most energetic colour in your logo; calls to action and highlights",
    neutral: "Neutral — quiet structure, dividers and calm backgrounds",
    background: "Background — the canvas; kept light so logo colours read true",
    text: "Text — body copy on light surfaces, taken from the logo's darkest tone",
  };
  return raw.map((r) => ({ role: r.role, hex: r.hex, name: "Logo " + r.role[0].toUpperCase() + r.role.slice(1), usage: usage[r.role] }));
}

/** Rank curated families against the questionnaire answers (deterministic). */
export function recommendFamilies(a: { personality: string[]; brandName: string }, limit?: number): { family: PaletteFamily; score: number; matched: string[] }[] {
  const scored = PALETTE_FAMILIES.map((f) => {
    const matched = f.affinities.filter((t) => a.personality.includes(t));
    return { family: f, score: matched.length, matched };
  }).sort((x, y) => y.score - x.score || hashString(a.brandName + x.family.id) - hashString(a.brandName + y.family.id));
  return limit ? scored.slice(0, limit) : scored;
}

const USAGE_HINTS: [RegExp, string][] = [
  [/packaging|signage|print/i, "The strong primary-to-accent contrast reproduces reliably at shelf and street distance, and holds up in CMYK print."],
  [/website|mobile app|product/i, "Primary and accent are tuned for on-screen hierarchy — clear interactive signals without visual noise."],
  [/social|advertising|events/i, "The accent saturates well in small, fast-scrolling formats — thumbnails, ads and event graphics stay legible."],
  [/presentations/i, "Muted neutrals keep slides calm while the accent marks the one thing the room should remember."],
];

/** Human explanation of why a direction fits this user's answers. */
export function whyFamily(f: PaletteFamily, matched: string[], a: { personality: string[]; usage: string[] }): string[] {
  const lines: string[] = [];
  if (matched.length) {
    lines.push(`Matches the ${matched.join(" + ").toLowerCase()} personality you chose in the questionnaire.`);
  } else {
    lines.push("A deliberate contrast to your questionnaire answers — useful when you want the brand to surprise its category.");
  }
  const accent = f.colors[2];
  const bg = f.colors[4];
  lines.push(`“${accent.name}” as the accent against “${bg.name}” backgrounds gives ${contrastRatio(accent.hex, bg.hex).toFixed(1)}:1 contrast — ${contrastRatio(accent.hex, bg.hex) >= 3 ? "clear, confident emphasis" : "soft, understated emphasis"}.`);
  for (const [re, hint] of USAGE_HINTS) {
    const hit = a.usage.find((u) => re.test(u));
    if (hit) { lines.push(hint); break; }
  }
  lines.push(f.rationale);
  return lines;
}

export function whyLogoPalette(list: BrandColor[], a: { personality: string[]; usage: string[] }): string[] {
  const accent = list.find((c) => c.role === "accent");
  const bg = list.find((c) => c.role === "background");
  const lines = [
    "Built directly from colours we extracted from your uploaded logo — the palette and the mark can never clash.",
  ];
  if (accent && bg) {
    lines.push(`Logo accent on the light background reads at ${contrastRatio(accent.hex, bg.hex).toFixed(1)}:1 — ${contrastRatio(accent.hex, bg.hex) >= 3 ? "strong enough for calls to action" : "best reserved for highlights, not buttons"}.`);
  }
  if (a.personality.length) lines.push(`Keeps your ${a.personality.slice(0, 3).join(" + ").toLowerCase()} positioning intact — these are already your colours.`);
  lines.push("Every role is editable below, and you can refresh the reading or explore a curated direction instead.");
  return lines;
}

/** Families as BrandColor lists (roles applied in canonical order). */
export function familyColors(f: PaletteFamily): BrandColor[] {
  return f.colors.map((col, i) => ({ ...col, role: ROLE_ORDER[i] }));
}
