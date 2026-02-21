import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromTable, supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function normalizeHost(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/:\d+$/, "");
}

function hostMatchesAllowed(host: string, allowed: string[]) {
  const h = normalizeHost(host);
  return allowed.some((d) => {
    const n = normalizeHost(d);
    return h === n || h === `www.${n}` || `www.${h}` === n;
  });
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    const userId = userRes?.user?.id ?? null;
    if (userErr || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: pErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single<{ business_id: string | null }>();
    if (pErr || !profile?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    const { data: business, error: bErr } = await adminFromTable("businesses")
      .select("allowed_domains,widget_theme")
      .eq("id", profile.business_id)
      .single<{ allowed_domains: string[] | null; widget_theme: Record<string, unknown> | null }>();
    if (bErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: sessions, error: sErr } = await supabaseAdmin
      .from("embed_sessions")
      .select("host,expires_at")
      .eq("business_id", profile.business_id)
      .eq("is_preview", false)
      .gte("expires_at", since)
      .order("expires_at", { ascending: false })
      .limit(25);
    if (sErr) {
      return NextResponse.json({ error: sErr.message }, { status: 500 });
    }

    const allowedDomains = (business.allowed_domains ?? []).map(normalizeHost).filter(Boolean);
    const matched = (sessions ?? []).find((row) => hostMatchesAllowed(String(row.host ?? ""), allowedDomains));
    const expiresAt = matched ? String(matched.expires_at ?? "") : "";
    const expiresMs = Date.parse(expiresAt);
    const lastSeenAt =
      Number.isFinite(expiresMs) && expiresMs > 0
        ? new Date(expiresMs - 10 * 60 * 1000).toISOString()
        : null;

    const themeObj =
      business.widget_theme && typeof business.widget_theme === "object"
        ? business.widget_theme
        : {};
    const widgetLive = typeof themeObj.widgetLive === "boolean" ? themeObj.widgetLive : true;

    return NextResponse.json(
      {
        ok: true,
        widgetLive,
        installed: Boolean(matched),
        activeDomainHost: matched ? String(matched.host ?? "") : null,
        lastSeenAt,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

