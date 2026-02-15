// src/lib/stripe.ts
import Stripe from "stripe";
import type { AliigoCurrency } from "@/lib/currency";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

// Don’t hardcode apiVersion. Keep stripe SDK up to date and let it pin internally.
export const stripe = new Stripe(secretKey, { typescript: true });

export type AliigoPlan = "starter" | "growth";

const PRICE_TABLE: Record<AliigoCurrency, Record<AliigoPlan, string>> = {
  EUR: {
    starter: process.env.STRIPE_PRICE_STARTER_EUR || "",
    growth: process.env.STRIPE_PRICE_GROWTH_EUR || "",
  },
  USD: {
    starter: process.env.STRIPE_PRICE_STARTER_USD || "",
    growth: process.env.STRIPE_PRICE_GROWTH_USD || "",
  },
};

function validateStripePriceConfig(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  const required = [
    "STRIPE_PRICE_STARTER_EUR",
    "STRIPE_PRICE_GROWTH_EUR",
    "STRIPE_PRICE_STARTER_USD",
    "STRIPE_PRICE_GROWTH_USD",
  ] as const;

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
      continue;
    }
    if (!/^price_[A-Za-z0-9]+$/.test(value)) invalid.push(key);
  }

  if (missing.length || invalid.length) {
    const parts: string[] = [];
    if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
    if (invalid.length) parts.push(`invalid format (expected price_*): ${invalid.join(", ")}`);
    throw new Error(`Stripe price config error (${parts.join(" | ")})`);
  }
}

validateStripePriceConfig();

export function isAliigoPlan(v: unknown): v is AliigoPlan {
  return v === "starter" || v === "growth";
}

export function assertPlanPrice(plan: AliigoPlan, currency: AliigoCurrency): string {
  const price = PRICE_TABLE[currency]?.[plan];
  if (!price) throw new Error(`Missing Stripe price for plan: ${plan} (${currency})`);
  return price;
}

export function planFromPriceId(priceId?: string | null): AliigoPlan | null {
  if (!priceId) return null;
  const entries = Object.entries(PRICE_TABLE) as Array<[AliigoCurrency, Record<AliigoPlan, string>]>;
  for (const [, prices] of entries) {
    if (priceId === prices.starter) return "starter";
    if (priceId === prices.growth) return "growth";
  }
  return null;
}
