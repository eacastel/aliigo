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

function domainLimitForPlan(plan: string | null | undefined): number {
  const p = (plan ?? "basic").toLowerCase();
  if (p === "pro") return 3;
  if (p === "custom") return Number.MAX_SAFE_INTEGER;
  return 1; // basic, starter, growth
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("key") || "").trim();
    if (!key) return json(req, { error: "Missing key" }, 400);

    // Authoritative host from headers (Origin/Referer) or Host fallback
    const host = sanitizeHost(originHost(req));
    if (!host) return json(req, { error: "Missing host" }, 400);

    // Pull only what we need for widget config
    const primaryBizRes = await supabase
      .from("businesses")
      .select(
        "id, slug, name, brand_name, allowed_domains, default_locale, enabled_locales, widget_theme, billing_plan, domain_limit, widget_header_logo_path"
      )
      .eq("public_embed_key", key)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string | null;
        brand_name: string | null;
        allowed_domains: string[] | null;
        default_locale: string | null;
        enabled_locales: string[] | null;
        widget_theme: ThemeDb;
        billing_plan: string | null;
        domain_limit: number | null;
        widget_header_logo_path: string | null;
      }>();

    let bizData = primaryBizRes.data;
    let bizError = primaryBizRes.error;

    if (bizError && /widget_header_logo_path.*does not exist/i.test(bizError.message || "")) {
      const fallback = await supabase
        .from("businesses")
        .select(
          "id, slug, name, brand_name, allowed_domains, default_locale, enabled_locales, widget_theme, billing_plan, domain_limit"
        )
        .eq("public_embed_key", key)
        .maybeSingle<{
          id: string;
          slug: string;
          name: string | null;
          brand_name: string | null;
          allowed_domains: string[] | null;
          default_locale: string | null;
          enabled_locales: string[] | null;
          widget_theme: ThemeDb;
          billing_plan: string | null;
          domain_limit: number | null;
        }>();
      bizData = fallback.data ? { ...fallback.data, widget_header_logo_path: null } : null;
      bizError = fallback.error;
    }

    if (bizError) {
      return json(req, { error: "Supabase error", details: bizError.message }, 500);
    }
    if (!bizData) return json(req, { error: "Invalid key" }, 403);

    const planDomainLimit = domainLimitForPlan(bizData.billing_plan);
    const effectiveLimit =
      typeof bizData.domain_limit === "number" && Number.isFinite(bizData.domain_limit) && bizData.domain_limit > 0
        ? Math.min(bizData.domain_limit, planDomainLimit)
        : planDomainLimit;
    const allowed = (bizData.allowed_domains ?? []).slice(0, effectiveLimit);
    if (!hostAllowed(host, allowed)) {
      return json(req, { error: "Domain not allowed" }, 403);
    }


    const locale = (bizData.default_locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
    const brand = (bizData.brand_name || bizData.name || "Aliigo").trim();
    const slug = bizData.slug;
    const themeObj: Record<string, unknown> =
      bizData.widget_theme && typeof bizData.widget_theme === "object"
        ? { ...(bizData.widget_theme as Record<string, unknown>) }
        : {};
    const isBasicPlan =
      bizData.billing_plan === "basic" || bizData.billing_plan === "starter";
    const showBrandingPref =
      typeof themeObj.showBranding === "boolean" ? themeObj.showBranding : null;
    const showBranding = isBasicPlan || showBrandingPref === true;
    const showHeaderIcon =
      bizData.billing_plan === "growth" ||
      bizData.billing_plan === "pro" ||
      bizData.billing_plan === "custom";
    const showWidget =
      typeof themeObj.widgetLive === "boolean" ? themeObj.widgetLive : true;
    const headerLogoPath =
      bizData.widget_header_logo_path ||
      (typeof themeObj.headerLogoPath === "string" ? themeObj.headerLogoPath : null);
    if (showHeaderIcon && headerLogoPath) {
      const signed = await supabase.storage
        .from("business-assets")
        .createSignedUrl(headerLogoPath, 60 * 60);
      if (!signed.error && signed.data?.signedUrl) {
        themeObj.headerLogoUrl = signed.data.signedUrl;
      }
    }
    const localeAuto =
      bizData.billing_plan === "growth" ||
      bizData.billing_plan === "pro" ||
      bizData.billing_plan === "custom";

    // Mint short-lived session token bound to this host
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const ins = await supabase.from("embed_sessions").insert({
      token,
      business_id: bizData.id,
      host,
      is_preview: false,
      expires_at: expiresAt,
    });

    if (ins.error) {
      return json(req, { error: "Failed to create session", details: ins.error.message }, 500);
    }

    const enabledLocalesRaw = Array.isArray(bizData.enabled_locales)
      ? bizData.enabled_locales
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
        show_widget: showWidget,
        enabled_locales: enabledLocales,
      },
      200
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return json(req, { error: message }, 500);
  }
}
