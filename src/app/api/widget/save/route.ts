// app/api/widget/save/route.ts


import { NextRequest, NextResponse } from "next/server";
import { adminFromTable } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

type Theme = {
  headerBg: string;
  headerText: string;
  bubbleUser: string;
  bubbleBot: string;
  sendBg: string;
  sendText: string;
  panelBg?: string;
  panelOpacity?: number;
  headerLogoUrl?: string;
  showBranding?: boolean;
  widgetLive?: boolean;
};
type ThemeDb = Partial<Theme>;

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(req: NextRequest) {
  try {
    // 1) Verify caller (user token)
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

    // 2) Accept updates (no userId in body anymore)
    const body = (await req.json().catch(() => ({}))) as Partial<{
      allowed_domains: string[];
      system_prompt: string;
      widget_theme: ThemeDb;
      brand_name: string;
    }>;

    // 3) Resolve business_id from *verified* userId (admin query ok)
    const { data: prof, error: profErr } = await adminFromTable("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof?.business_id) {
      return NextResponse.json({ error: "Business not linked" }, { status: 400 });
    }

    // 4) Build update payload
    const update: Record<string, unknown> = {};
    if (Array.isArray(body.allowed_domains)) update.allowed_domains = body.allowed_domains;
    if (typeof body.system_prompt === "string") update.system_prompt = body.system_prompt;
    if (body.widget_theme && typeof body.widget_theme === "object") update.widget_theme = body.widget_theme;
    
    if (typeof body.brand_name === "string") {
      const v = body.brand_name.trim();
      if (v) update.brand_name = v;
    }


    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // 5) Persist
    type BizThemeRow = { widget_theme: ThemeDb | null };

    const { data: updated, error: updErr } = await adminFromTable("businesses")
      .update(update)
      .eq("id", prof.business_id)
      .select("widget_theme")
      .maybeSingle<BizThemeRow>();

    if (updErr) throw updErr;

    return NextResponse.json({
      ok: true,
      theme: updated?.widget_theme ?? null,
      brand_name: update.brand_name ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
