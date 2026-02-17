"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import { type AliigoCurrency } from "@/lib/currency";
import BillingCheckout from "@/components/billing/BillingCheckout";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";
type BillingPlan = "basic" | "growth" | "pro" | "custom" | "starter" | null;

type BillingPayload = {
  status: BillingStatus;
  plan: BillingPlan;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type BillingPageClientProps = {
  initialCurrency: AliigoCurrency;
};

export default function BillingPageClient({ initialCurrency }: BillingPageClientProps) {
  const t = useTranslations("Billing");
  const locale = useLocale();
  const router = useRouter();

  const [jwt, setJwt] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ minimal additions (needed for portal UX)
  const [portalLoading, setPortalLoading] = useState<null | "change_plan" | "cancel" | "resume">(null);
  const [portalError, setPortalError] = useState<string | null>(null);


  // ✅ safe translator to avoid runtime crash when a key is missing
  const safeT = (key: string, values?: Record<string, unknown>, fallback?: string) => {
    try {
      return t(key as never, values as never);
    } catch {
      return fallback ?? key;
    }
  };

    // --- UI parity with /dashboard/messages buttons ---
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  const btnBrand =
    `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;

  const btnNeutral =
    `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;

  const btnNeutralStrong =
    `${btnBase} bg-zinc-950/40 text-zinc-200 ring-zinc-700/60 hover:bg-zinc-900/50`;

  // --- pricing (display only; keep in sync with Stripe) ---
  const currency = initialCurrency;
  const displayLocale = currency === "USD" ? "en-US" : locale;
  const priceFmt = new Intl.NumberFormat(displayLocale, { style: "currency", currency, maximumFractionDigits: 0 });
  const priceForPlan = (p: BillingPlan) =>
    p === "basic" || p === "starter"
      ? priceFmt.format(currency === "USD" ? 49 : 39)
      : p === "growth"
        ? priceFmt.format(currency === "USD" ? 99 : 89)
        : p === "pro"
          ? priceFmt.format(currency === "USD" ? 149 : 129)
          : p === "custom"
            ? priceFmt.format(currency === "USD" ? 349 : 299)
            : "—";
  const basicPrice = priceForPlan("basic");
  const growthPrice = priceForPlan("growth");
  const proPrice = priceForPlan("pro");
  const customPrice = priceForPlan("custom");

  const perMonth = safeT("perMonth", undefined, "/month");

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale]
  );

  

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session;

        if (!s?.user) {
          router.replace({
            pathname: "/login",
            query: { redirect: "/dashboard/billing" },
          });
          return;
        }

        const confirmed = Boolean(s.user.email_confirmed_at);
        if (!cancelled) setEmailConfirmed(confirmed);

        const token = s.access_token;
        if (!cancelled) setJwt(token);

        const res = await fetch("/api/billing/status", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const j = (await res.json().catch(() => ({}))) as Partial<BillingPayload>;
        if (!cancelled) {
          setBilling({
            status: (j.status as BillingStatus) ?? "incomplete",
            plan: (j.plan as BillingPlan) ?? null,
            trial_end: typeof j.trial_end === "string" ? j.trial_end : null,
            current_period_end: typeof j.current_period_end === "string" ? j.current_period_end : null,
            cancel_at_period_end: Boolean(j.cancel_at_period_end),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const showConfirmStep = emailConfirmed === false;

  const status = billing?.status ?? null;

  // Show checkout only when they truly need to pay / fix billing
  const showCheckout =
    emailConfirmed === true &&
    !!jwt &&
    (status === "incomplete" || status === "canceled" || status === "past_due");

  const trialDaysLeft = daysUntil(billing?.trial_end ?? null);

  const planLabel =
    billing?.plan === "basic" || billing?.plan === "starter"
      ? safeT("planBasic", undefined, "Aliigo Basic")
      : billing?.plan === "growth"
        ? safeT("planGrowth", undefined, "Aliigo Growth")
        : billing?.plan === "pro"
          ? safeT("planPro", undefined, "Aliigo Pro")
          : billing?.plan === "custom"
            ? safeT("planCustom", undefined, "Aliigo Custom")
            : safeT("planUnknown", undefined, "Aliigo");

  const trialEndsText = billing?.trial_end ? fmt.format(new Date(billing.trial_end)) : "—";

  const renewsText =
    billing?.current_period_end ? fmt.format(new Date(billing.current_period_end)) : "—";

  // keep your original subscribed check (trialing/active)
  const isSubscribed = status === "trialing" || status === "active";

  // BUT allow portal actions for past_due too (upgrade/cancel should still be possible)
  const canManage =
    emailConfirmed === true &&
    !!jwt &&
    (status === "trialing" || status === "active" || status === "past_due");

  const showStatusCard =
    Boolean(portalError) || showConfirmStep || (emailConfirmed && canManage);

  type BillingAction = "change_plan" | "cancel" | "resume";

async function runBillingAction(action: BillingAction, nextPlan?: BillingPlan) {
  if (!jwt) return;

  setPortalError(null);
  setPortalLoading(action);

  try {
    const res = await fetch("/api/stripe/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        action,
        ...(action === "change_plan" ? { plan: nextPlan } : {}),
      }),
    });

    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(j.error || "Billing update failed");

    // Refresh billing payload after update (no reload)
    const r2 = await fetch("/api/billing/status", {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const j2 = (await r2.json().catch(() => ({}))) as Partial<BillingPayload>;

    setBilling({
      status: (j2.status as BillingStatus) ?? "incomplete",
      plan: (j2.plan as BillingPlan) ?? null,
      trial_end: typeof j2.trial_end === "string" ? j2.trial_end : null,
      current_period_end: typeof j2.current_period_end === "string" ? j2.current_period_end : null,
      cancel_at_period_end: Boolean(j2.cancel_at_period_end),
    });
  } catch (e) {
    setPortalError(e instanceof Error ? e.message : "Billing update failed");
  } finally {
    setPortalLoading(null);
  }
}


  return (
    <main className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{safeT("title", undefined, "Billing")}</h1>

      {loading ? (
        <p className="text-zinc-300">{safeT("loading", undefined, "Loading…")}</p>
      ) : (
        <>
          {/* Top message */}
          <p className="text-zinc-300 mb-6">
            {!emailConfirmed
              ? safeT("pendingUnconfirmed", undefined, "Confirm your email to continue.")
              : isSubscribed
                ? safeT("subscribedIntro", undefined, "Your subscription is active.")
                : safeT("pending", undefined, "Billing is not active yet.")}
          </p>

          {!isSubscribed && emailConfirmed ? (
            <div className="mb-6 rounded-2xl border border-[#84c9ad]/30 bg-zinc-950/60 p-5 text-sm text-zinc-200 shadow-[0_0_0_1px_rgba(132,201,173,0.08)]">
              <div className="text-base font-semibold text-white">
                {safeT("trialTitle", undefined, "30-day free trial, cancel anytime")}
              </div>
              <p className="mt-2 text-zinc-300">
                {safeT(
                  "trialSubtitle",
                  undefined,
                  "Start your trial now. You won’t be charged until it ends, and you can cancel or change plans at any time."
                )}
              </p>
              <div className="mt-3 space-y-1 text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#84c9ad]" />
                  <span>{safeT("trialBullet1", undefined, "No charge if you cancel before the trial ends.")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#84c9ad]" />
                  <span>{safeT("trialBullet2", undefined, "Upgrade, downgrade, or cancel anytime from this page.")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#84c9ad]" />
                  <span>{safeT("trialBullet3", undefined, "You’ll keep access until the end of your current period.")}</span>
                </div>
              </div>
            </div>
          ) : null}

          {showStatusCard ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-3 text-sm text-zinc-200">
            {portalError ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {portalError}
              </div>
            ) : null}

            {/* If not confirmed */}
            {showConfirmStep ? (
              <>
                <div>{safeT("step1", undefined, "1) Confirm your email.")}</div>
                <div>{safeT("step2", undefined, "2) Activate billing to access the dashboard.")}</div>
                <div>{safeT("step3", undefined, "3) Until billing is active, you’ll stay here.")}</div>
              </>
            ) : null}

            {/* If subscribed (trialing/active) */}
            {emailConfirmed && canManage ? (
              <>
                <div className="font-semibold">{safeT("alreadyActiveTitle", undefined, "Subscription active")}</div>

                <div className="text-zinc-300">
                  {safeT("currentPlan", undefined, "Current plan:")}{" "}
                  <span className="text-white">{planLabel}</span>{" "}
                  <span className="text-zinc-400">
                    ({priceForPlan(billing?.plan ?? null)} {perMonth})
                  </span>
                </div>


                {status === "trialing" ? (
                  <div className="text-zinc-300">
                    {safeT("trialEnds", undefined, "Trial ends:")}{" "}
                    <span className="text-white">{trialEndsText}</span>
                    {typeof trialDaysLeft === "number" ? (
                      <span className="text-brand-300">
                        {" "}
                        (
                        {safeT(
                          "daysLeft",
                          { count: trialDaysLeft },
                          locale.startsWith("es")
                            ? `${trialDaysLeft} días restantes`
                            : `${trialDaysLeft} days left`
                        )}
                        )
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-zinc-300">
                    {safeT("renewsOn", undefined, "Renews on:")}{" "}
                    <span className="text-white">{renewsText}</span>
                    {billing?.cancel_at_period_end ? (
                      <span className="text-zinc-400"> ({safeT("cancelAtPeriodEnd", undefined, "will cancel at period end")})</span>
                    ) : null}
                  </div>
                )}

                <div className="text-xs text-zinc-500">{safeT("noNeedToPayAgain", undefined, "You do not need to pay again.")}</div>

                <div className="mt-4 space-y-3">
                  <div className="text-sm font-medium text-zinc-100">
                    {safeT("plansTitle", undefined, "Plans")}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Basic card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold text-zinc-100">
                          {safeT("planBasic", undefined, "Aliigo Basic")}
                        </div>
                        <div className="text-sm text-zinc-300">
                          {basicPrice} <span className="text-zinc-500">{perMonth}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {safeT("planBasicDesc", undefined, "Best for solo businesses getting started.")}
                      </div>

                      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                        <li>• {safeT("basicF1", undefined, "50 conversations / month")}</li>
                        <li>• {safeT("basicF2", undefined, "1 domain")}</li>
                        <li>• {safeT("basicF3", undefined, "Reply-only assistant")}</li>
                        <li>• {safeT("basicF4", undefined, "Lead capture (name, email)")}</li>
                        <li>• {safeT("basicF5", undefined, "Email support")}</li>
                      </ul>

                      <div className="mt-4">
                        {billing?.plan === "basic" || billing?.plan === "starter" ? (
                          <button type="button" disabled className={btnNeutralStrong}>
                            {safeT("currentPlan", undefined, "Current plan")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => runBillingAction("change_plan", "basic")}
                            disabled={portalLoading !== null}
                            className={btnNeutral}
                          >
                            {portalLoading === "change_plan"
                              ? safeT("loading", undefined, "Loading…")
                              : safeT(
                                  "switchToBasic",
                                  undefined,
                                  `Switch to Basic (${basicPrice} ${perMonth})`
                                )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Growth card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold text-zinc-100">
                          {safeT("planGrowth", undefined, "Aliigo Growth")}
                        </div>
                        <div className="text-sm text-zinc-300">
                          {growthPrice} <span className="text-zinc-500">{perMonth}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {safeT("planGrowthDesc", undefined, "Ideal for clinics, agencies, and service businesses.")}
                      </div>

                      <div className="mt-3 text-xs text-zinc-400">
                        {safeT("growthIntro", undefined, "Everything in Basic, plus:")}
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                        <li>• {safeT("growthF1", undefined, "500 conversations / month")}</li>
                        <li>• {safeT("growthF2", undefined, "1 domain")}</li>
                        <li>• {safeT("growthF3", undefined, "Richer lead capture fields")}</li>
                        <li>• {safeT("growthF4", undefined, "Email + chat support")}</li>
                      </ul>

                      <div className="mt-4">
                        {billing?.plan === "growth" ? (
                          <button type="button" disabled className={btnNeutralStrong}>
                            {safeT("currentPlan", undefined, "Current plan")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => runBillingAction("change_plan", "growth")}
                            disabled={portalLoading !== null}
                            className={btnBrand}
                          >
                            {portalLoading === "change_plan"
                              ? safeT("loading", undefined, "Loading…")
                              : safeT(
                                  "upgradeToGrowth",
                                  undefined,
                                  `Upgrade to Growth (${growthPrice} ${perMonth})`
                                )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold text-zinc-100">
                          {safeT("planPro", undefined, "Aliigo Pro")}
                        </div>
                        <div className="text-sm text-zinc-300">
                          {proPrice} <span className="text-zinc-500">{perMonth}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {safeT("planProDesc", undefined, "Best for growing teams that need higher volume.")}
                      </div>

                      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                        <li>• {safeT("proF1", undefined, "2,000 conversations / month")}</li>
                        <li>• {safeT("proF2", undefined, "3 domains")}</li>
                        <li>• {safeT("proF3", undefined, "Priority support")}</li>
                        <li>• {safeT("proF4", undefined, "Advanced assistant controls")}</li>
                      </ul>

                      <div className="mt-4">
                        {billing?.plan === "pro" ? (
                          <button type="button" disabled className={btnNeutralStrong}>
                            {safeT("currentPlan", undefined, "Current plan")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => runBillingAction("change_plan", "pro")}
                            disabled={portalLoading !== null}
                            className={btnBrand}
                          >
                            {portalLoading === "change_plan"
                              ? safeT("loading", undefined, "Loading…")
                              : safeT("upgradeToPro", undefined, `Upgrade to Pro (${proPrice} ${perMonth})`)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom (sales-led) */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 sm:col-span-2 lg:col-span-3">
                    <div className="text-sm font-semibold text-zinc-100">
                      {safeT("planCustom", undefined, "Aliigo Custom")}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {safeT("planCustomDesc", undefined, "For advanced teams needing high volume and custom workflows.")}
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">
                      {safeT("planCustomPrice", { price: customPrice }, `from ${customPrice}`)}
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                      <li>• {safeT("customF1", undefined, "10k+ conversations / month")}</li>
                      <li>• {safeT("customF2", undefined, "Unlimited domains")}</li>
                      <li>• {safeT("customF3", undefined, "Advanced automations & integrations")}</li>
                      <li>• {safeT("customF4", undefined, "Dedicated support")}</li>
                    </ul>
                    <div className="mt-4">
                      <Link
                        href={{ pathname: "/pricing", hash: "pro-contact" }}
                        className={btnNeutral}
                      >
                        {safeT("planCustomCta", undefined, "Contact sales")}
                      </Link>
                    </div>
                  </div>
                </div>


                {/* ✅ Manage / Cancel buttons (no logout here) */}
                {/* (3) Self-serve actions: upgrade / cancel / resume (no portal, no logout) */}
                {canManage ? (
                  <div className="pt-2 flex flex-wrap gap-3">
                    {/* Cancel / Resume */}
                    {billing?.cancel_at_period_end ? (
                      <button
                        type="button"
                        onClick={() => runBillingAction("resume")}
                        disabled={portalLoading !== null}
                        className={btnNeutralStrong}
                      >
                        {portalLoading === "resume"
                          ? safeT("loading", undefined, "Loading…")
                          : safeT("resumeMembership", undefined, "Keep membership")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => runBillingAction("cancel")}
                        disabled={portalLoading !== null}
                        className={btnNeutral}
                      >
                        {portalLoading === "cancel"
                          ? safeT("loading", undefined, "Loading…")
                          : safeT("cancelMembership", undefined, "Cancel membership")}
                      </button>
                    )}

                  </div>
                ) : null}

              </>
            ) : null}

          </div>
          ) : null}

          {/* Only show checkout when payment is actually needed */}
          {showCheckout ? (
            <div className="mt-6">
              <BillingCheckout jwt={jwt} currency={currency} />
            </div>
          ) : null}

          {/* ✅ keep support only */}
          <div className="mt-6">
            <Link
              href={{ pathname: "/pricing", hash: "pro-contact" }}
              className="inline-flex px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 hover:bg-zinc-900/60"
            >
              {safeT("contact", undefined, "Contact support")}
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
