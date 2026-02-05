import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireBusiness } from "@/lib/server/auth";
import {
  countUserMessagesForBusiness,
  resolveUsageWindow,
  type BillingPlan,
  type BillingStatus,
} from "@/lib/billingUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { businessId } = await requireBusiness(req);

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("billing_status,billing_plan,trial_end,current_period_end")
      .eq("id", businessId)
      .single<{
        billing_status: BillingStatus | null;
        billing_plan: BillingPlan;
        trial_end: string | null;
        current_period_end: string | null;
      }>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const status = data.billing_status ?? "incomplete";
    const plan = data.billing_plan ?? null;

    const window = resolveUsageWindow({
      status,
      plan,
      trialEnd: data.trial_end ?? null,
      currentPeriodEnd: data.current_period_end ?? null,
    });

    const used = await countUserMessagesForBusiness({
      supabase: supabaseAdmin,
      businessId,
      periodStart: window.periodStart,
      periodEnd: window.periodEnd,
    });

    const remaining = window.limit === null ? null : Math.max(window.limit - used, 0);

    return NextResponse.json({
      status,
      plan,
      used,
      limit: window.limit,
      remaining,
      period_start: window.periodStart,
      period_end: window.periodEnd,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
