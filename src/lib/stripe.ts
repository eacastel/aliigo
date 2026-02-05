// src/lib/stripe.ts
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

// Don’t hardcode apiVersion. Keep stripe SDK up to date and let it pin internally.
export const stripe = new Stripe(secretKey, { typescript: true });

export type AliigoPlan = "starter" | "growth";

const PRICE_STARTER = process.env.STRIPE_PRICE_STARTER_EUR || "";
const PRICE_GROWTH = process.env.STRIPE_PRICE_GROWTH_EUR || "";

export const PLAN_TO_PRICE: Record<AliigoPlan, string> = {
  starter: PRICE_STARTER,
  growth: PRICE_GROWTH,
};

export function isAliigoPlan(v: unknown): v is AliigoPlan {
  return v === "starter" || v === "growth";
}

export function assertPlanPrice(plan: AliigoPlan): string {
  const price = PLAN_TO_PRICE[plan];
  if (!price) throw new Error(`Missing Stripe price for plan: ${plan}`);
  return price;
}
