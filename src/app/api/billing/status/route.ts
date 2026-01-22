// src/app/api/billing/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";



function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);


export async function GET(req: NextRequest) {
  try {
    const jwt = getBearer(req);
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    // Validate user token (anon client with Authorization header)
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    const userId = userRes?.user?.id ?? null;
    if (userErr || !userId) return json({ error: "Unauthorized" }, 401);

    // Find business_id for this user
    const prof = await supabaseAdmin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .maybeSingle<{ business_id: string | null }>();

    if (prof.error) return json({ error: "Supabase error", details: prof.error.message }, 500);
    const businessId = prof.data?.business_id ?? null;
    if (!businessId) return json({ status: "incomplete" satisfies BillingStatus }, 200);

    // Read billing status from businesses (placeholder logic)
    const biz = await supabaseAdmin
      .from("businesses")
      .select("billing_status")
      .eq("id", businessId)
      .maybeSingle<{ billing_status: BillingStatus | null }>();

    if (biz.error) return json({ error: "Supabase error", details: biz.error.message }, 500);

    const status: BillingStatus = biz.data?.billing_status ?? "incomplete";
    return json({ status }, 200);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return json({ error: msg }, 500);
  }
}
