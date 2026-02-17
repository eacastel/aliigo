// src/lib/stripe.ts
import Stripe from "stripe";
import type { AliigoCurrency } from "@/lib/currency";

let stripeClient: Stripe | null = null;

// Don’t hardcode apiVersion. Keep stripe SDK up to date and let it pin internally.
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  stripeClient = new Stripe(secretKey, { typescript: true });
  return stripeClient;
}

export type AliigoPlan = "basic" | "growth" | "pro";
export type AliigoPlanInput = AliigoPlan | "starter";

const PRICE_TABLE: Record<AliigoCurrency, Record<AliigoPlan, string>> = {
  EUR: {
    basic: process.env.STRIPE_PRICE_BASIC_EUR || process.env.STRIPE_PRICE_STARTER_EUR || "",
    growth: process.env.STRIPE_PRICE_GROWTH_EUR || "",
    pro: process.env.STRIPE_PRICE_PRO_EUR || "",
  },
  USD: {
    basic: process.env.STRIPE_PRICE_BASIC_USD || process.env.STRIPE_PRICE_STARTER_USD || "",
    growth: process.env.STRIPE_PRICE_GROWTH_USD || "",
    pro: process.env.STRIPE_PRICE_PRO_USD || "",
  },
};

function validateStripePriceConfig(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  const required = [
    "STRIPE_PRICE_BASIC_EUR",
    "STRIPE_PRICE_GROWTH_EUR",
    "STRIPE_PRICE_PRO_EUR",
    "STRIPE_PRICE_BASIC_USD",
    "STRIPE_PRICE_GROWTH_USD",
    "STRIPE_PRICE_PRO_USD",
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

export function normalizeAliigoPlan(v: unknown): AliigoPlan | null {
  if (v === "starter" || v === "basic") return "basic";
  if (v === "growth") return "growth";
  if (v === "pro") return "pro";
  return null;
}

export function isAliigoPlan(v: unknown): v is AliigoPlanInput {
  return normalizeAliigoPlan(v) !== null;
}

export function assertPlanPrice(plan: AliigoPlan, currency: AliigoCurrency): string {
  validateStripePriceConfig();
  const price = PRICE_TABLE[currency]?.[plan];
  if (!price) throw new Error(`Missing Stripe price for plan: ${plan} (${currency})`);
  return price;
}

export function planFromPriceId(priceId?: string | null): AliigoPlan | null {
  if (!priceId) return null;
  const entries = Object.entries(PRICE_TABLE) as Array<[AliigoCurrency, Record<AliigoPlan, string>]>;
  for (const [, prices] of entries) {
    if (priceId === prices.basic) return "basic";
    if (priceId === prices.growth) return "growth";
    if (priceId === prices.pro) return "pro";
  }
  return null;
}
