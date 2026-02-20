import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { originHost } from "@/lib/embedGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeHost(v: string) {
  return (v || "").trim().toLowerCase().replace(/:\d+$/, "");
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
        "id, slug, name, brand_name, default_locale, widget_theme, billing_plan, widget_header_logo_path",
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
        widget_header_logo_path: string | null;
      }>();

    if (bizRes.error) return json({ error: "Supabase error", details: bizRes.error.message }, 500);
    if (!bizRes.data?.id) return json({ error: "Business not found" }, 404);

    const host = sanitizeHost(originHost(req)) || "localhost";
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const ins = await supabaseAdmin.from("embed_sessions").insert({
      token,
      business_id: bizRes.data.id,
      host,
      is_preview: true,
      expires_at: expiresAt,
    });

    if (ins.error) return json({ error: "Failed to create session", details: ins.error.message }, 500);

    const locale = (bizRes.data.default_locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
    const brand = (bizRes.data.brand_name || bizRes.data.name || "Aliigo").trim();
    const themeObj: Record<string, unknown> =
      bizRes.data.widget_theme && typeof bizRes.data.widget_theme === "object"
        ? { ...(bizRes.data.widget_theme as Record<string, unknown>) }
        : {};

    const showHeaderIcon =
      bizRes.data.billing_plan === "growth" ||
      bizRes.data.billing_plan === "pro" ||
      bizRes.data.billing_plan === "custom";

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

    return json({ token, locale, brand, theme: themeObj, show_header_icon: showHeaderIcon }, 200);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, 500);
  }
}
