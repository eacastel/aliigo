import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing'; // Ensure this path matches where you created the routing file

// 1. Initialize the next-intl middleware
const handleI18nRouting = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // ---------------------------------------------------------
  // STEP 1: Custom Logic (WWW Redirect)
  // ---------------------------------------------------------
  const host = req.headers.get("host") || "";

  if (host === "www.aliigo.com") {
    const url = new URL(req.url);
    url.host = "aliigo.com";
    return NextResponse.redirect(url, 308);
  }

  // ---------------------------------------------------------
  // STEP 2: Internationalization Logic
  // ---------------------------------------------------------
  // If the domain is correct, let next-intl handle the locale 
  // detection and redirection (e.g., / -> /es)
  const response = handleI18nRouting(req);

  return response;
}

// ---------------------------------------------------------
// STEP 3: Config / Matcher
// ---------------------------------------------------------
export const config = {
  // Match only internationalized pathnames
  // This regex skips:
  // - /api (API routes)
  // - /_next (Internal Next.js files)
  // - /... (files with extensions like .png, .ico, .svg)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};