// src/app/api/stripe/subscribe/route.ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, assertPlanPrice, isAliigoPlan, type AliigoPlan } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireBusiness } from "@/lib/server/auth";

export const runtime = "nodejs";

type Action = "start" | "cancel" | "resume" | "change_plan";

function toIsoOrNull(unixSeconds?: number | null): string | null {
  if (!unixSeconds && unixSeconds !== 0) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

// Stripe typings in some versions don’t expose these fields even though runtime does.
// Keep this local and explicit so TS stops fighting you.
type SubPeriods = {
  current_period_end: number;
  trial_end: number | null;
  cancel_at_period_end: boolean;
};

type AliigoStripeSub = Stripe.Subscription & SubPeriods;

export async function POST(req: Request) {
  try {
    const { businessId } = await requireBusiness(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const action = (body.action as Action | undefined) ?? "start";

    // Pull customer + subscription ids from DB
    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .select("stripe_customer_id,stripe_subscription_id")
      .eq("id", businessId)
      .single<{ stripe_customer_id: string | null; stripe_subscription_id: string | null }>();

    if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 });

    const customerId = biz.stripe_customer_id;
    const subscriptionId = biz.stripe_subscription_id;

    // --- ACTION: START (create subscription) ---
    if (action === "start") {
      const plan = body.plan as unknown;
      const setupIntentId = body.setup_intent_id as unknown;

      if (!isAliigoPlan(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      if (!setupIntentId || typeof setupIntentId !== "string") {
        return NextResponse.json({ error: "Missing setup_intent_id" }, { status: 400 });
      }
      if (!customerId) {
        return NextResponse.json({ error: "Missing stripe_customer_id (call setup-intent first)" }, { status: 400 });
      }

      // Confirm SetupIntent succeeded and belongs to that customer
      const si = await stripe.setupIntents.retrieve(setupIntentId);

      if (si.status !== "succeeded") {
        return NextResponse.json({ error: `SetupIntent not succeeded (status=${si.status})` }, { status: 400 });
      }

      const siCustomer = typeof si.customer === "string" ? si.customer : si.customer?.id;
      if (siCustomer && siCustomer !== customerId) {
        return NextResponse.json({ error: "SetupIntent customer mismatch" }, { status: 400 });
      }

      const paymentMethodId =
        typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;

      if (!paymentMethodId) {
        return NextResponse.json({ error: "Missing payment_method on SetupIntent" }, { status: 400 });
      }

      const sub = (await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: assertPlanPrice(plan as AliigoPlan) }],
        trial_period_days: 30,
        default_payment_method: paymentMethodId,
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { business_id: businessId, plan: plan as AliigoPlan },
      })) as unknown as AliigoStripeSub;

      const patch = {
        stripe_subscription_id: sub.id,
        billing_plan: plan as AliigoPlan,
        billing_status: sub.status === "trialing" ? "trialing" : "incomplete",
        trial_end: toIsoOrNull(sub.trial_end),
        current_period_end: toIsoOrNull(sub.current_period_end),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
      };

      const { error: upErr } = await supabaseAdmin.from("businesses").update(patch).eq("id", businessId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      return NextResponse.json({
        ok: true,
        subscriptionId: sub.id,
        status: sub.status,
        trial_end: patch.trial_end,
        current_period_end: patch.current_period_end,
        cancel_at_period_end: patch.cancel_at_period_end,
        plan: patch.billing_plan,
      });
    }

    // For all other actions, we need an existing subscription
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing stripe_subscription_id" }, { status: 400 });
    }

    // --- ACTION: CANCEL (at period end) ---
    if (action === "cancel") {
      const sub = (await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })) as unknown as AliigoStripeSub;

      const patch = {
        billing_status: sub.status,
        trial_end: toIsoOrNull(sub.trial_end),
        current_period_end: toIsoOrNull(sub.current_period_end),
        cancel_at_period_end: sub.cancel_at_period_end ?? true,
      };

      const { error: upErr } = await supabaseAdmin.from("businesses").update(patch).eq("id", businessId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      return NextResponse.json({ ok: true });
    }

    // --- ACTION: RESUME (undo cancel_at_period_end) ---
    if (action === "resume") {
      const sub = (await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })) as unknown as AliigoStripeSub;

      const patch = {
        billing_status: sub.status,
        trial_end: toIsoOrNull(sub.trial_end),
        current_period_end: toIsoOrNull(sub.current_period_end),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
      };

      const { error: upErr } = await supabaseAdmin.from("businesses").update(patch).eq("id", businessId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      return NextResponse.json({ ok: true });
    }

    // --- ACTION: CHANGE PLAN ---
    if (action === "change_plan") {
      const plan = body.plan as unknown;
      if (!isAliigoPlan(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }

      const existing = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as Stripe.Subscription;

      const firstItemId = existing.items?.data?.[0]?.id;
      if (!firstItemId) {
        return NextResponse.json({ error: "Subscription has no items" }, { status: 400 });
      }

      const updated = (await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: firstItemId, price: assertPlanPrice(plan as AliigoPlan) }],
        // Avoid surprise immediate charges; it will take effect on next invoice / trial end.
        proration_behavior: "none",
        metadata: { business_id: businessId, plan: plan as AliigoPlan },
      })) as unknown as AliigoStripeSub;

      const patch = {
        billing_plan: plan as AliigoPlan,
        billing_status: updated.status,
        trial_end: toIsoOrNull(updated.trial_end),
        current_period_end: toIsoOrNull(updated.current_period_end),
        cancel_at_period_end: updated.cancel_at_period_end ?? false,
      };

      const { error: upErr } = await supabaseAdmin.from("businesses").update(patch).eq("id", businessId);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
