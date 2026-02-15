import type { AliigoPlan } from "@/lib/stripe";

export type PlanLimits = {
  seat_limit: number;
  domain_limit: number;
};

const LIMITS_BY_PLAN: Record<AliigoPlan, PlanLimits> = {
  starter: { seat_limit: 1, domain_limit: 1 },
  growth: { seat_limit: 3, domain_limit: 4 },
};

export function limitsForPlan(plan: AliigoPlan): PlanLimits {
  return LIMITS_BY_PLAN[plan];
}

export function effectiveDomainLimit(opts: {
  billingPlan: string | null | undefined;
  domainLimit: number | null | undefined;
}): number {
  if (typeof opts.domainLimit === "number" && opts.domainLimit > 0) return opts.domainLimit;
  if (opts.billingPlan === "starter") return LIMITS_BY_PLAN.starter.domain_limit;
  if (opts.billingPlan === "growth") return LIMITS_BY_PLAN.growth.domain_limit;
  return 1;
}

