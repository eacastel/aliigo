import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const LOCALES = new Set(["en", "es"]);
const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

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
  //    cookie first -> browser -> (let next-intl defaultLocale handle)
  if (!pathLocale) {
    const desired = getCookieLocale(req) || getBrowserLocale(req);
    if (desired) {
      url.pathname = `/${desired}${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.redirect(url);
      setLocaleCookie(res, desired); // keep cookie consistent
      return res;
    }
  }

  // 3) Let next-intl do the routing (defaultLocale fallback etc.)
  const res = handleI18nRouting(req);

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
