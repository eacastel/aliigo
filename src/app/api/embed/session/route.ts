import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { originHost, hostAllowed } from "@/lib/embedGate";
import crypto from "crypto";

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
      return NextResponse.json(
        {
          error: "Missing host",
          debug: {
            origin: req.headers.get("origin"),
            referer: req.headers.get("referer"),
            host: req.headers.get("host"),
          },
        },
        { status: 400 }
      );
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
    const allowed = bizRes.data.allowed_domains || [];

    if (!hostAllowed(host, allowed)) {
      return NextResponse.json(
        {
          error: "Domain not allowed",
          debug: {
            extractedHost: host,
            allowedDomains: allowed,
            // useful to confirm we matched the expected business
            businessId: bizRes.data.id,
          },
        },
        { status: 403 }
      );
    }

    // 3) Get latest embed token; if none exists, create one
    const tokRes = await supabase
      .from("embed_tokens")
      .select("token")
      .eq("business_id", bizRes.data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ token: string }>();

    if (!tokRes.data?.token) {
      const token = crypto.randomUUID().replace(/-/g, "");

      const ins = await supabase
        .from("embed_tokens")
        .insert({ business_id: bizRes.data.id, token })
        .select("token")
        .single<{ token: string }>();

      if (ins.error || !ins.data?.token) {
        return NextResponse.json(
          { error: "Failed to create embed token", details: ins.error?.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ token: ins.data.token }, { status: 200 });
    }


    return NextResponse.json({ token: tokRes.data.token }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
