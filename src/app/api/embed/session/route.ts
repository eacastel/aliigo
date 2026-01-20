// src/app/api/embed/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { originHost, hostAllowed } from "@/lib/embedGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function corsHeadersFor(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin") || "";
  const base: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (!origin) return base;
  return { ...base, "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(req) });
}

function json(req: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeadersFor(req) });
}

function sanitizeHost(v: string) {
  return (v || "").trim().toLowerCase().replace(/:\d+$/, "");
}

type ThemeDb = Record<string, unknown> | null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key) return json(req, { error: "Missing key" }, 400);

    // Authoritative host from headers (Origin/Referer) or Host fallback
    const host = sanitizeHost(originHost(req));
    if (!host) return json(req, { error: "Missing host" }, 400);

    // Pull only what we need for widget config
    const bizRes = await supabase
      .from("businesses")
      .select("id, slug, name, brand_name, allowed_domains, default_locale, widget_theme")
      .eq("public_embed_key", key)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string | null;
        brand_name: string | null;
        allowed_domains: string[] | null;
        default_locale: string | null;
        widget_theme: ThemeDb;
      }>();

    if (bizRes.error) {
      return json(req, { error: "Supabase error", details: bizRes.error.message }, 500);
    }
    if (!bizRes.data) return json(req, { error: "Invalid key" }, 403);

    const allowed = bizRes.data.allowed_domains ?? [];
    if (!hostAllowed(host, allowed)) {
      return json(req, { error: "Domain not allowed" }, 403);
    }

    const locale = (bizRes.data.default_locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
    const brand = (bizRes.data.brand_name || bizRes.data.name || "Aliigo").trim();
    const slug = bizRes.data.slug;
    const theme = bizRes.data.widget_theme ?? null;

    // Mint short-lived session token bound to this host
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const ins = await supabase.from("embed_sessions").insert({
      token,
      business_id: bizRes.data.id,
      host,
      is_preview: false,
      expires_at: expiresAt,
    });

    if (ins.error) {
      return json(req, { error: "Failed to create session", details: ins.error.message }, 500);
    }

    return json(req, { token, locale, brand, slug, theme }, 200);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return json(req, { error: message }, 500);
  }
}
