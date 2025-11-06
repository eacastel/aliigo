// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/join",
  "/invite",
  "/api/waitlist",
  "/api/gate",
  "/robots.txt",
  "/favicon.ico",
  "/sitemap.xml",
  "/_next",        // Next.js assets
  "/assets",       // your static assets (optional)
  "/static",       // if you use /static
];

// helper: is request path public?
function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // 1) Host redirect: www.aliigo.com → aliigo.com
  const host = req.headers.get("host") || "";
  if (host === "www.aliigo.com") {
    const to = new URL(req.url);
    to.host = "aliigo.com";
    return NextResponse.redirect(to, 308);
  }

  // 2) Allow public routes (waitlist, invite, join, assets, etc.)
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 3) Invite bypass (user redeemed an invite code)
  const invited = req.cookies.get("aliigo_invited")?.value === "1";
  if (invited) return NextResponse.next();

  // 4) Shared password gate (internal preview)
  const gated = req.cookies.get("aliigo_gate")?.value === "ok";
  if (gated) return NextResponse.next();

  // 5) Not allowed → rewrite to /join?locked=1 (keeps URL nice, no external redirect)
  const joinUrl = url.clone();
  joinUrl.pathname = "/join";
  joinUrl.searchParams.set("locked", "1");
  return NextResponse.rewrite(joinUrl);
}

// Run on all routes (including pages & API). Asset prefixes are filtered above.
export const config = {
  matcher: "/:path*",
};
