import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { originHost } from "@/lib/embedGate";
import {
  effectivePlanForEntitlements,
  isGrowthOrHigher,
  isTrialActive,
  normalizePlan,
} from "@/lib/effectivePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeHost(v: string) {
  return (v || "").trim().toLowerCase().replace(/:\d+$/, "");
}

function isDashboardRequest(req: NextRequest): boolean {
  const referer = req.headers.get("referer") || "";
  if (!referer) return false;
  try {
    const url = new URL(referer);
    return /\/dashboard(\/|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

type ThemeDb = Record<string, unknown> | null;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    // Pull Aliigo’s own business record by slug (change if you want env-based)
    const slug = (process.env.ALIIGO_SUPPORT_SLUG || "aliigo").trim();

    const bizRes = await supabaseAdmin
      .from("businesses")
      .select(
        "id, slug, name, brand_name, default_locale, widget_theme, billing_plan, billing_status, trial_end, widget_header_logo_path",
      )
      .eq("slug", slug)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string | null;
        brand_name: string | null;
        default_locale: string | null;
        widget_theme: ThemeDb;
        billing_plan: string | null;
        billing_status: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
        trial_end: string | null;
        widget_header_logo_path: string | null;
      }>();

    if (bizRes.error) return json({ error: "Supabase error", details: bizRes.error.message }, 500);
    if (!bizRes.data?.id) return json({ error: "Business not found" }, 404);

    const host = sanitizeHost(originHost(req)) || "localhost";
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Treat dashboard requests as preview sessions so they do not count as
    // website installation heartbeat. Public pages should count.
    const isPreview = isDashboardRequest(req);

    const ins = await supabaseAdmin.from("embed_sessions").insert({
      token,
      business_id: bizRes.data.id,
      host,
      is_preview: isPreview,
      expires_at: expiresAt,
    });

    if (ins.error) return json({ error: "Failed to create session", details: ins.error.message }, 500);

    const locale = (bizRes.data.default_locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
    const brand = (bizRes.data.brand_name || bizRes.data.name || "Aliigo").trim();
    const themeObj: Record<string, unknown> =
      bizRes.data.widget_theme && typeof bizRes.data.widget_theme === "object"
        ? { ...(bizRes.data.widget_theme as Record<string, unknown>) }
        : {};

    const effectivePlan = effectivePlanForEntitlements({
      billingPlan: bizRes.data.billing_plan,
      billingStatus: bizRes.data.billing_status,
      trialEnd: bizRes.data.trial_end,
    });
    const rawPlan = normalizePlan(bizRes.data.billing_plan);
    const trialActive = isTrialActive(bizRes.data.billing_status, bizRes.data.trial_end);
    const forceBasicBranding = (rawPlan === "basic" || rawPlan === "starter") && !trialActive;
    const defaultShowBranding = rawPlan === "basic" || rawPlan === "starter";
    const showBrandingPref =
      typeof themeObj.showBranding === "boolean" ? themeObj.showBranding : null;
    const showBranding = forceBasicBranding || (showBrandingPref ?? defaultShowBranding);
    const showHeaderIcon = isGrowthOrHigher(effectivePlan);

    const headerLogoPath =
      bizRes.data.widget_header_logo_path ||
      (typeof themeObj.headerLogoPath === "string" ? themeObj.headerLogoPath : null);
    if (showHeaderIcon && headerLogoPath) {
      const signed = await supabaseAdmin.storage
        .from("business-assets")
        .createSignedUrl(headerLogoPath, 60 * 60);
      if (!signed.error && signed.data?.signedUrl) {
        themeObj.headerLogoUrl = signed.data.signedUrl;
      }
    }

    return json(
      { token, locale, brand, theme: themeObj, show_branding: showBranding, show_header_icon: showHeaderIcon },
      200,
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, 500);
  }
}
