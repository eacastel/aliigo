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

function errExtras(err: unknown): { details?: unknown; hint?: unknown; code?: unknown } {
  if (!err || typeof err !== "object") return {};
  const rec = err as Record<string, unknown>;
  return { details: rec.details, hint: rec.hint, code: rec.code };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key")?.trim() || "";
    const hostParam = (searchParams.get("host") || "").trim().toLowerCase();

    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const hostFromReq = originHost(req);
    const host = (hostParam || hostFromReq || "").replace(/:\d+$/, "");
    if (!host) return NextResponse.json({ error: "Missing host" }, { status: 400 });

    const bizRes = await supabase
        .from("businesses")
        .select("id, allowed_domains")
        .eq("public_embed_key", key)
        .maybeSingle();

      if (bizRes.error) {
  const extra = errExtras(bizRes.error);
  return NextResponse.json(
    {
      error: "Supabase error",
      debug: {
        keyReceived: key,
        hostReceived: host,
        hostParam,
        hostFromReq,
        supabaseError: {
          message: bizRes.error.message,
          ...extra,
        },
      },
    },
    { status: 500 }
  );
}

      if (!bizRes.data) {
        return NextResponse.json(
          { error: "Invalid key", debug: { keyReceived: key, hostReceived: host, hostParam, hostFromReq } },
          { status: 403 }
        );
      }

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

      return NextResponse.json(
        { token: ins.data.token, debug: { keyReceived: key, hostReceived: host } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { token: tokRes.data.token, debug: { keyReceived: key, hostReceived: host } },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}