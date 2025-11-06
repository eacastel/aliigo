import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/join",
  "/robots.txt",
  "/favicon.ico",
  "/sitemap.xml",
  "/_next",
  "/assets",
  "/static",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function unauthorized() {
  return new NextResponse("Auth required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Aliigo Preview"' },
  });
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // 0) www -> apex redirect stays
  const host = req.headers.get("host") || "";
  if (host === "www.aliigo.com") {
    const to = new URL(req.url);
    to.host = "aliigo.com";
    return NextResponse.redirect(to, 308);
  }

  // allow public paths
  if (isPublic(pathname)) return NextResponse.next();

  // Basic Auth check
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  const creds = Buffer.from(auth.split(" ")[1] || "", "base64").toString();
  const [user, pass] = creds.split(":");
  if (user !== process.env.BASIC_AUTH_USER || pass !== process.env.BASIC_AUTH_PASS) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
