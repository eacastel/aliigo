// src/lib/currency.ts
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export type AliigoCurrency = "EUR" | "USD";

export const CURRENCY_COOKIE = "aliigo_currency";

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

export function getCurrencyFromHeaders(headers: Headers): AliigoCurrency | null {
  const country =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    null;
  if (!country) return null;
  return currencyForCountry(country);
}

export function getCurrencyFromCookies(cookies: ReadonlyRequestCookies): AliigoCurrency | null {
  const v = cookies.get(CURRENCY_COOKIE)?.value || "";
  return normalizeCurrency(v);
}

export function getClientCurrency(): AliigoCurrency | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]+)`));
  return normalizeCurrency(match?.[1] ?? null);
}
