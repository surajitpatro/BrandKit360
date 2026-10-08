import { formatPrice } from "@contracts/brand";

/**
 * Indicative currency conversion for display only (§29).
 *
 * Plans are priced and settled in USD. The table below converts USD amounts
 * into local currencies at indicative rates sourced from public central-bank
 * reference rates (Federal Reserve H.10, October 2026), rounded for display.
 * Converted amounts are labelled "indicative" wherever they appear.
 */

export interface CurrencyOption {
  code: string;
  label: string;
  /** units per 1 USD (indicative) */
  rate: number;
  locale: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", rate: 1, locale: "en-US" },
  { code: "EUR", label: "Euro", rate: 1.13, locale: "de-DE" },
  { code: "GBP", label: "British Pound", rate: 1.32, locale: "en-GB" },
  { code: "INR", label: "Indian Rupee", rate: 96.3, locale: "en-IN" },
  { code: "AUD", label: "Australian Dollar", rate: 0.7, locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar", rate: 1.43, locale: "en-CA" },
  { code: "AED", label: "UAE Dirham", rate: 3.67, locale: "en-AE" },
  { code: "SGD", label: "Singapore Dollar", rate: 1.28, locale: "en-SG" },
  { code: "JPY", label: "Japanese Yen", rate: 158, locale: "ja-JP" },
  { code: "CNY", label: "Chinese Yuan", rate: 6.7, locale: "zh-CN" },
  { code: "BRL", label: "Brazilian Real", rate: 5.22, locale: "pt-BR" },
  { code: "MXN", label: "Mexican Peso", rate: 18.2, locale: "es-MX" },
  { code: "ZAR", label: "South African Rand", rate: 16.7, locale: "en-ZA" },
  { code: "KRW", label: "South Korean Won", rate: 1346, locale: "ko-KR" },
  { code: "HKD", label: "Hong Kong Dollar", rate: 7.85, locale: "en-HK" },
];

const RATES = new Map(CURRENCY_OPTIONS.map((c) => [c.code, c]));

const EUROZONE = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "IE",
  "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
]);

const REGION_TO_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", IN: "INR", AU: "AUD", CA: "CAD",
  AE: "AED", SG: "SGD", JP: "JPY", CN: "CNY", BR: "BRL",
  MX: "MXN", ZA: "ZAR", KR: "KRW", HK: "HKD",
};

const STORAGE_KEY = "bk360-display-currency";

export function detectCurrency(): string {
  if (typeof navigator === "undefined") return "USD";
  const region = (navigator.language.split("-")[1] ?? "").toUpperCase();
  if (EUROZONE.has(region)) return "EUR";
  return REGION_TO_CURRENCY[region] ?? "USD";
}

export function getSavedCurrency(): string {
  if (typeof window === "undefined") return "USD";
  const param = new URLSearchParams(window.location.search).get("currency");
  if (param && RATES.has(param.toUpperCase())) return param.toUpperCase();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && RATES.has(saved) ? saved : detectCurrency();
}

export function setSavedCurrency(code: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, code);
}

/** Convert a USD minor-unit amount into the target currency's minor units. */
export function convertMinorUnits(usdMinor: number, code: string): number {
  const c = RATES.get(code);
  if (!c || c.code === "USD") return usdMinor;
  return Math.round(usdMinor * c.rate);
}

/** Format a USD minor-unit amount in the target currency (indicative). */
export function formatConverted(usdMinor: number, code: string): string {
  const c = RATES.get(code);
  if (!c) return formatPrice(usdMinor, "USD");
  if (c.code === "USD") return formatPrice(usdMinor, "USD");
  const converted = convertMinorUnits(usdMinor, code);
  const digits = c.rate >= 20 ? 0 : 2;
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(converted / 100);
  } catch {
    return `${code} ${(converted / 100).toLocaleString()}`;
  }
}
