// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  planFromPriceId,
  normalizeAliigoPlan,
} from "@/lib/stripe";
import { limitsForPlan } from "@/lib/planLimits";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";

type SubscriptionPeriods = {
  current_period_end: number; // unix seconds
  trial_end: number | null;   // unix seconds or null
  cancel_at_period_end: boolean;
};

type AliigoStripeSubscription = Stripe.Subscription & SubscriptionPeriods;


function toIsoOrNull(unixSeconds?: number | null): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function mapStripeStatus(status: Stripe.Subscription.Status): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "incomplete";
  }
}

async function resolveBusinessIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  // Preferred: metadata set when we created the subscription
  const metaBusinessId = sub.metadata?.business_id;
  if (metaBusinessId) return metaBusinessId;

  // Fallback: match on subscription id
  {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle<{ id: string }>();

    if (!error && data?.id) return data.id;
  }

  // Fallback: match on customer id
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (customerId) {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle<{ id: string }>();

    if (!error && data?.id) return data.id;
  }

  return null;
}

async function applySubscription(stripe: Stripe, sub: Stripe.Subscription) {
  const businessId = await resolveBusinessIdFromSubscription(sub);
  if (!businessId) return;

  const subx = sub as unknown as AliigoStripeSubscription;

  const customerId = typeof subx.customer === "string" ? subx.customer : subx.customer?.id;
  const priceId = subx.items.data?.[0]?.price?.id ?? null;

  const plan =
    planFromPriceId(priceId) ??
    normalizeAliigoPlan(subx.metadata?.plan);

  const patch: Record<string, unknown> = {
    billing_status: mapStripeStatus(subx.status),
    stripe_customer_id: customerId ?? null,
    stripe_subscription_id: subx.id,
    ...(plan ? { billing_plan: plan } : {}),
    ...(plan ? limitsForPlan(plan) : {}),
    trial_end: toIsoOrNull(subx.trial_end),
    current_period_end: toIsoOrNull(subx.current_period_end),
    cancel_at_period_end: subx.cancel_at_period_end ?? false,
  };


  const { error } = await supabaseAdmin.from("businesses").update(patch).eq("id", businessId);
  if (error) throw new Error(error.message);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  if (!secret) return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(stripe, sub);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Stripe.Invoice;
        const inv = invoice as unknown as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };

        const subId =
          typeof inv.subscription === "string"
            ? inv.subscription
            : typeof inv.subscription === "object" && inv.subscription
              ? inv.subscription.id
              : null;

        if (subId) {
          const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as Stripe.Subscription;
          await applySubscription(stripe, sub);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
