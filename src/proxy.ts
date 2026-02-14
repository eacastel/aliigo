import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const LOCALES = new Set(["en", "es"]);
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

  const ES_SLUG_REDIRECTS: Record<string, string> = {
    "/es/pricing": "/es/precios",
    "/es/signup": "/es/registro",
    "/es/login": "/es/iniciar-sesion",
    "/es/reset-password": "/es/restablecer-contrasena",
    "/es/update-password": "/es/actualizar-contrasena",
    "/es/check-email": "/es/revisar-correo",
    "/es/why-aliigo": "/es/por-que-aliigo",
    "/es/founder": "/es/fundador",
  };

  const EN_SLUG_REDIRECTS: Record<string, string> = {
    "/en/precios": "/en/pricing",
    "/en/registro": "/en/signup",
    "/en/iniciar-sesion": "/en/login",
    "/en/restablecer-contrasena": "/en/reset-password",
    "/en/actualizar-contrasena": "/en/update-password",
    "/en/revisar-correo": "/en/check-email",
    "/en/por-que-aliigo": "/en/why-aliigo",
    "/en/fundador": "/en/founder",
  };

  // 2) If NO locale in path, redirect using:
  //    country -> browser -> (let next-intl defaultLocale handle)
  if (!pathLocale) {
    const desired = getCountryLocale(req) || getBrowserLocale(req);
    if (desired) {
      url.pathname = `/${desired}${pathname === "/" ? "" : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // 2.5) Redirect legacy/alternate slugs to localized SEO slugs
  if (pathLocale === "es" && ES_SLUG_REDIRECTS[pathname]) {
    url.pathname = ES_SLUG_REDIRECTS[pathname];
    return NextResponse.redirect(url, 308);
  }
  if (pathLocale === "en" && EN_SLUG_REDIRECTS[pathname]) {
    url.pathname = EN_SLUG_REDIRECTS[pathname];
    return NextResponse.redirect(url, 308);
  }

  // 3) Let next-intl do the routing (defaultLocale fallback etc.)
  const res = handleI18nRouting(req);

  const debugCountry = getCountryCode(req);
  if (debugCountry) {
    res.cookies.set("aliigo_country_debug", debugCountry, {
      path: "/",
      maxAge: ONE_MONTH,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
