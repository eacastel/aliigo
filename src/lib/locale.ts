// src/lib/locale.ts
export const LOCALE_COOKIE = "NEXT_LOCALE" as const;
export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(v: string | null | undefined): AppLocale {
  const raw = (v || "").toLowerCase();
  return raw.startsWith("en") ? "en" : "es";
}

export function getLocaleCookieClient(): AppLocale | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));

  if (!cookie) return null;
  const value = decodeURIComponent(cookie.split("=").slice(1).join("="));
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : null;
}

export function setLocaleCookieClient(locale: AppLocale) {
  if (typeof document === "undefined") return;

  // 1 year
  const maxAge = 60 * 60 * 24 * 365;

  document.cookie = [
    `${LOCALE_COOKIE}=${encodeURIComponent(locale)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ");
}
