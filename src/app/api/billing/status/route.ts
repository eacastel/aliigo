// src/app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireBusiness } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";
type BillingPlan = "basic" | "growth" | "pro" | "custom" | "starter" | null;

export async function GET(req: Request) {
  try {
    const { businessId } = await requireBusiness(req);

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("billing_status,billing_plan,trial_end,current_period_end,cancel_at_period_end")
      .eq("id", businessId)
      .single<{
        billing_status: BillingStatus | null;
        billing_plan: BillingPlan;
        trial_end: string | null;
        current_period_end: string | null;
        cancel_at_period_end: boolean | null;
      }>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Business not found" }, { status: 404 });


    return NextResponse.json({
      status: data?.billing_status ?? "incomplete",
      plan: data?.billing_plan ?? null,
      trial_end: data?.trial_end ?? null,
      current_period_end: data?.current_period_end ?? null,
      cancel_at_period_end: Boolean(data?.cancel_at_period_end),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
