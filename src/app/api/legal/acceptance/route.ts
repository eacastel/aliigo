import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-client-ip") ||
    "unknown"
  ).trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : null;
    const termsVersion =
      typeof body?.termsVersion === "string" ? body.termsVersion : null;
    const locale = typeof body?.locale === "string" ? body.locale : null;
    const agreement =
      typeof body?.agreement === "string" ? body.agreement : null;
    const marketingOptIn = Boolean(body?.marketingOptIn);

    if (!userId || !termsVersion || !agreement) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { error } = await supabaseAdmin.from("legal_acceptances").insert({
      user_id: userId,
      terms_version: termsVersion,
      locale,
      agreement,
      marketing_opt_in: marketingOptIn,
      ip,
      user_agent: userAgent,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}
