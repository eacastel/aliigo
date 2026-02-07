import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { CURRENCY_COOKIE, currencyForCountry, normalizeCurrency } from "@/lib/currency";

const handleI18nRouting = createMiddleware(routing);

const LOCALES = new Set(["en", "es"]);
const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_MONTH = 60 * 60 * 24 * 30;
const SPANISH_COUNTRIES = new Set([
  "ES", // Spain
  "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV",
  "NI", "CR", "PR", "UY", "PA",
]);

function getCountryCode(req: NextRequest): string | null {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;
  return country ? country.toUpperCase() : null;
}

function getCookieLocale(req: NextRequest): "en" | "es" | null {
  const v = (req.cookies.get(LOCALE_COOKIE)?.value || "").toLowerCase();
  return LOCALES.has(v) ? (v as "en" | "es") : null;
}

function getBrowserLocale(req: NextRequest): "en" | "es" | null {
  const h = (req.headers.get("accept-language") || "").toLowerCase();
  if (h.includes("es")) return "es";
  if (h.includes("en")) return "en";
  return null;
}

function getCountryLocale(req: NextRequest): "en" | "es" | null {
  const country = getCountryCode(req);
  if (!country) return null;
  const code = country.toUpperCase();
  if (SPANISH_COUNTRIES.has(code)) return "es";
  return "en";
}

function getPathLocale(pathname: string): "en" | "es" | null {
  const seg1 = pathname.split("/")[1] || "";
  return LOCALES.has(seg1) ? (seg1 as "en" | "es") : null;
}

function setLocaleCookie(res: NextResponse, locale: "en" | "es") {
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}

function setCurrencyCookie(res: NextResponse, currency: string) {
  res.cookies.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: ONE_MONTH,
    sameSite: "lax",
  });
}

export default function middleware(req: NextRequest) {
  // 1) Keep your www redirect
  const host = req.headers.get("host") || "";
  if (host === "www.aliigo.com") {
    const url = new URL(req.url);
    url.host = "aliigo.com";
    return NextResponse.redirect(url, 308);
  }

  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const pathLocale = getPathLocale(pathname);

  // 2) If NO locale in path, redirect using:
  //    cookie first -> country -> browser -> (let next-intl defaultLocale handle)
  if (!pathLocale) {
    const desired = getCookieLocale(req) || getCountryLocale(req) || getBrowserLocale(req);
    if (desired) {
      url.pathname = `/${desired}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.redirect(url);
      setLocaleCookie(res, desired); // keep cookie consistent
      return res;
    }
  }

  // 3) Let next-intl do the routing (defaultLocale fallback etc.)
  const res = handleI18nRouting(req);

  // 3.5) Currency detection (EU => EUR, US/other => USD), allow manual override
  const queryCurrency = normalizeCurrency(req.nextUrl.searchParams.get("currency"));
  const cookieCurrency = normalizeCurrency(req.cookies.get(CURRENCY_COOKIE)?.value || "");

  if (queryCurrency) {
    setCurrencyCookie(res, queryCurrency);
  } else if (!cookieCurrency) {
    const country = getCountryCode(req);
    const inferred = currencyForCountry(country);
    setCurrencyCookie(res, inferred);
  }

  const debugCountry = getCountryCode(req);
  if (debugCountry) {
    res.cookies.set("aliigo_country_debug", debugCountry, {
      path: "/",
      maxAge: ONE_MONTH,
      sameSite: "lax",
    });
  }

  // 4) If locale IS in path, sync cookie to match it (nice-to-have)
  if (pathLocale) {
    const cookieLocale = getCookieLocale(req);
    if (cookieLocale !== pathLocale) {
      setLocaleCookie(res, pathLocale);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
