// src/lib/embedGate.ts

import type { NextRequest } from "next/server";

export function originHost(req: NextRequest) {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    // ✅ Same-origin requests often have no Origin/Referer, so use Host
    return (req.headers.get("host") || "").split(":")[0].toLowerCase();
  }
}

export function hostAllowed(host: string, allowedDomains: string[] | null | undefined) {
  const allowed = (allowedDomains || []).map((d) => (d || "").toLowerCase().trim()).filter(Boolean);
  return allowed.some((d) => host === d || host.endsWith(`.${d}`));
}
