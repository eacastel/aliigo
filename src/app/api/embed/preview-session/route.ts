// src/app/api/embed/preview-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function aliigoHost() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return "aliigo.com";
  }
}

type ThemeDb = Record<string, unknown> | null;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const jwt = getBearer(req);
    if (!jwt) return json(req, { error: "Unauthorized" }, 401);

    // user client to validate auth token
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    const userId = userRes?.user?.id ?? null;
    if (userErr || !userId) return json(req, { error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key) return json(req, { error: "Missing key" }, 400);

    const bizRes = await supabaseAdmin
      .from("businesses")
      .select(
        "id, slug, name, brand_name, default_locale, enabled_locales, widget_theme, billing_plan, widget_header_logo_path"
      )
      .eq("public_embed_key", key)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string | null;
        brand_name: string | null;
        default_locale: string | null;
        enabled_locales: string[] | null;
        widget_theme: ThemeDb;
        billing_plan: string | null;
        widget_header_logo_path: string | null;
      }>();

    if (bizRes.error) return json(req, { error: "Supabase error", details: bizRes.error.message }, 500);
    if (!bizRes.data?.id) return json(req, { error: "Invalid key" }, 403);

    // ownership check
    const profRes = await supabaseAdmin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .maybeSingle<{ business_id: string | null }>();

    if (profRes.error) return json(req, { error: "Supabase error", details: profRes.error.message }, 500);
    if (!profRes.data?.business_id || profRes.data.business_id !== bizRes.data.id) {
      return json(req, { error: "Forbidden" }, 403);
    }

    const locale = (bizRes.data.default_locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
    const brand = (bizRes.data.brand_name || bizRes.data.name || "Aliigo").trim();
    const slug = bizRes.data.slug;
    const themeObj: Record<string, unknown> =
      bizRes.data.widget_theme && typeof bizRes.data.widget_theme === "object"
        ? { ...(bizRes.data.widget_theme as Record<string, unknown>) }
        : {};
    const showBranding =
      bizRes.data.billing_plan === "basic" || bizRes.data.billing_plan === "starter";
    const showHeaderIcon =
      bizRes.data.billing_plan === "growth" ||
      bizRes.data.billing_plan === "pro" ||
      bizRes.data.billing_plan === "custom";
    if (showHeaderIcon && bizRes.data.widget_header_logo_path) {
      const signed = await supabaseAdmin.storage
        .from("business-assets")
        .createSignedUrl(bizRes.data.widget_header_logo_path, 60 * 60);
      if (!signed.error && signed.data?.signedUrl) {
        themeObj.headerLogoUrl = signed.data.signedUrl;
      }
    }
    const localeAuto =
      bizRes.data.billing_plan === "growth" ||
      bizRes.data.billing_plan === "pro" ||
      bizRes.data.billing_plan === "custom";

    const host = aliigoHost();

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const ins = await supabaseAdmin.from("embed_sessions").insert({
      token,
      business_id: bizRes.data.id,
      host,
      is_preview: true,
      expires_at: expiresAt,
    });

    if (ins.error) return json(req, { error: "Failed to create session", details: ins.error.message }, 500);

    const enabledLocalesRaw = Array.isArray(bizRes.data.enabled_locales)
      ? bizRes.data.enabled_locales
      : [];
    const enabledLocales = Array.from(
      new Set(enabledLocalesRaw.map((l) => (String(l).toLowerCase().startsWith("es") ? "es" : "en")))
    );
    if (!enabledLocales.includes(locale)) enabledLocales.push(locale);

    return json(
      req,
      {
        token,
        locale,
        brand,
        slug,
        theme: themeObj,
        show_branding: showBranding,
        locale_auto: localeAuto,
        show_header_icon: showHeaderIcon,
        enabled_locales: enabledLocales,
      },
      200
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json(req, { error: msg }, 500);
  }
}
