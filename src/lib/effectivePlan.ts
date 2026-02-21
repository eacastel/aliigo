export type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null | undefined;

export type NormalizedPlan = "basic" | "starter" | "growth" | "pro" | "custom";

export function normalizePlan(plan: string | null | undefined): NormalizedPlan {
  const p = (plan ?? "basic").toLowerCase();
  if (p === "starter") return "starter";
  if (p === "growth") return "growth";
  if (p === "pro") return "pro";
  if (p === "custom") return "custom";
  return "basic";
}

export function isTrialActive(status: BillingStatus, trialEnd: string | null | undefined): boolean {
  if (status !== "trialing") return false;
  if (!trialEnd) return true;
  const endMs = Date.parse(trialEnd);
  if (!Number.isFinite(endMs)) return true;
  return endMs > Date.now();
}

export function effectivePlanForEntitlements(opts: {
  billingPlan: string | null | undefined;
  billingStatus: BillingStatus;
  trialEnd: string | null | undefined;
}): NormalizedPlan {
  if (isTrialActive(opts.billingStatus, opts.trialEnd)) return "pro";
  return normalizePlan(opts.billingPlan);
}

export function isGrowthOrHigher(plan: NormalizedPlan | string | null | undefined): boolean {
  const p = normalizePlan(plan);
  return p === "growth" || p === "pro" || p === "custom";
}

export function planAllowsHeaderLogo(plan: NormalizedPlan | string | null | undefined): boolean {
  return isGrowthOrHigher(plan);
}

export function domainLimitForPlan(plan: NormalizedPlan | string | null | undefined): number {
  const p = normalizePlan(plan);
  if (p === "pro") return 3;
  if (p === "custom") return Number.MAX_SAFE_INTEGER;
  return 1;
}

export function localeLimitForPlan(plan: NormalizedPlan | string | null | undefined): number {
  const p = normalizePlan(plan);
  if (p === "growth") return 2;
  if (p === "pro") return 3;
  if (p === "custom") return Number.MAX_SAFE_INTEGER;
  return 1;
}
