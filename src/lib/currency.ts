// src/lib/currency.ts
export type AliigoCurrency = "EUR" | "USD";

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA
  "IS", "LI", "NO",
]);

export function normalizeCurrency(input?: string | null): AliigoCurrency | null {
  if (!input) return null;
  const v = input.toUpperCase();
  return v === "EUR" || v === "USD" ? (v as AliigoCurrency) : null;
}

export function currencyForCountry(countryCode?: string | null): AliigoCurrency {
  if (!countryCode) return "USD";
  const code = countryCode.toUpperCase();
  if (EU_COUNTRIES.has(code)) return "EUR";
  if (code === "US") return "USD";
  return "USD";
}

export function getCurrencyFromHeaders(headers: Headers): AliigoCurrency {
  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    null;
  return currencyForCountry(country);
}
