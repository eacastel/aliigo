import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { originHost, hostAllowed } from "@/lib/embedGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key")?.trim() || "";

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const host = originHost(req);
    if (!host) {
      return NextResponse.json({ error: "Missing host" }, { status: 400 });
    }

    // 1) Find business by public key
    const bizRes = await supabase
      .from("businesses")
      .select("id, allowed_domains")
      .eq("public_embed_key", key)
      .single<{ id: string; allowed_domains: string[] | null }>();

    if (bizRes.error || !bizRes.data) {
      return NextResponse.json({ error: "Invalid key" }, { status: 403 });
    }

    // 2) Validate host is allowlisted
    if (!hostAllowed(host, bizRes.data.allowed_domains || [])) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    // 3) Return latest embed token for that business
    const tokRes = await supabase
      .from("embed_tokens")
      .select("token")
      .eq("business_id", bizRes.data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ token: string }>();

    return NextResponse.json({ token: tokRes.data?.token ?? null }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
