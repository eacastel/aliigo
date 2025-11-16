import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Redirect www.aliigo.com -> aliigo.com
  if (host === "www.aliigo.com") {
    const url = new URL(req.url);
    url.host = "aliigo.com";
    return NextResponse.redirect(url, 308);
  }

  // No gate, just continue
  return NextResponse.next();
}

// Run middleware on all paths so the redirect works everywhere
export const config = { matcher: "/:path*" };