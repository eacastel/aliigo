import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";
export type BillingPlan = "basic" | "growth" | "pro" | "custom" | "starter" | null;

const DEFAULT_LIMITS = {
  trial: 200,
  basic: 50,
  growth: 500,
  pro: 2000,
  custom: 10000,
  periodDays: 30,
};

function parseLimit(raw: string | undefined, fallback: number): number | null {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return null;
  return Math.floor(n);
}

function parsePeriodDays(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export function getBillingLimitsFromEnv() {
  return {
    trial: parseLimit(process.env.TRIAL_MESSAGE_LIMIT, DEFAULT_LIMITS.trial),
    basic: parseLimit(
      process.env.BASIC_MESSAGE_LIMIT ?? process.env.STARTER_MESSAGE_LIMIT,
      DEFAULT_LIMITS.basic
    ),
    growth: parseLimit(process.env.GROWTH_MESSAGE_LIMIT, DEFAULT_LIMITS.growth),
    pro: parseLimit(process.env.PRO_MESSAGE_LIMIT, DEFAULT_LIMITS.pro),
    custom: parseLimit(process.env.CUSTOM_MESSAGE_LIMIT, DEFAULT_LIMITS.custom),
    periodDays: parsePeriodDays(process.env.BILLING_PERIOD_DAYS, DEFAULT_LIMITS.periodDays),
  };
}

export function resolveUsageWindow(opts: {
  status: BillingStatus;
  plan: BillingPlan;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
}) {
  const limits = getBillingLimitsFromEnv();

  const periodEndRaw =
    opts.status === "trialing"
      ? opts.trialEnd ?? opts.currentPeriodEnd
      : opts.currentPeriodEnd;

  const periodEndMs = periodEndRaw ? Date.parse(periodEndRaw) : Date.now();
  const periodEnd = new Date(Number.isFinite(periodEndMs) ? periodEndMs : Date.now()).toISOString();

  const periodStartMs = Date.parse(periodEnd) - limits.periodDays * 24 * 60 * 60 * 1000;
  const periodStart = new Date(periodStartMs).toISOString();

  const limit =
    opts.status === "trialing"
      ? limits.trial
      : opts.plan === "basic" || opts.plan === "starter"
        ? limits.basic
        : opts.plan === "growth"
          ? limits.growth
          : opts.plan === "pro"
            ? limits.pro
            : opts.plan === "custom"
              ? limits.custom
              : null;

  return {
    periodStart,
    periodEnd,
    limit,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function countUserMessagesForBusiness(opts: {
  supabase: SupabaseClient;
  businessId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const { data: conversations, error: convErr } = await opts.supabase
    .from("conversations")
    .select("id")
    .eq("business_id", opts.businessId)
    .gte("last_message_at", opts.periodStart)
    .lte("last_message_at", opts.periodEnd);

  if (convErr) throw convErr;

  const conversationIds = (conversations ?? []).map((row) => row.id).filter(Boolean);
  if (conversationIds.length === 0) return 0;

  const chunks = chunkArray(conversationIds, 200);
  let total = 0;

  for (const batch of chunks) {
    const { count, error } = await opts.supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", batch)
      .eq("role", "user")
      .gte("created_at", opts.periodStart)
      .lte("created_at", opts.periodEnd);

    if (error) throw error;
    total += count ?? 0;
  }

  return total;
}
