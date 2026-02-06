"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import BillingCheckout from "@/components/billing/BillingCheckout";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";
type BillingPlan = "starter" | "growth" | null;

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

export default function BillingPage() {
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
  const PRICE_STARTER = "€99";
  const PRICE_GROWTH = "€149";

  const priceForPlan = (p: BillingPlan) =>
    p === "starter" ? PRICE_STARTER : p === "growth" ? PRICE_GROWTH : "—";

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
          router.replace("/login?redirect=/dashboard/billing");
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
    billing?.plan === "starter"
      ? safeT("planStarter", undefined, "Aliigo Starter")
      : billing?.plan === "growth"
        ? safeT("planGrowth", undefined, "Aliigo Growth")
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
    <main className="max-w-3xl mx-auto p-6">
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
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-200">
              <div className="text-base font-semibold text-white">
                {safeT("trialTitle", undefined, "30-day free trial, cancel anytime")}
              </div>
              <p className="mt-2 text-zinc-400">
                {safeT(
                  "trialSubtitle",
                  undefined,
                  "Start your trial now. You won’t be charged until it ends, and you can cancel or change plans at any time."
                )}
              </p>
              <div className="mt-3 space-y-1 text-zinc-300">
                <div>• {safeT("trialBullet1", undefined, "No charge if you cancel before the trial ends.")}</div>
                <div>• {safeT("trialBullet2", undefined, "Upgrade, downgrade, or cancel anytime from this page.")}</div>
                <div>• {safeT("trialBullet3", undefined, "You’ll keep access until the end of your current period.")}</div>
              </div>
            </div>
          ) : null}

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

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Starter card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold text-zinc-100">
                          {safeT("planStarter", undefined, "Aliigo Starter")}
                        </div>
                        <div className="text-sm text-zinc-300">
                          {PRICE_STARTER} <span className="text-zinc-500">{perMonth}</span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                        <li>• {safeT("starterF1", undefined, "Website chat widget + inbox")}</li>
                        <li>• {safeT("starterF2", undefined, "Basic assistant + domain verification")}</li>
                        <li>• {safeT("starterF3", undefined, "Conversation history")}</li>
                      </ul>
                    </div>

                    {/* Growth card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="flex items-baseline justify-between">
                        <div className="text-sm font-semibold text-zinc-100">
                          {safeT("planGrowth", undefined, "Aliigo Growth")}
                        </div>
                        <div className="text-sm text-zinc-300">
                          {PRICE_GROWTH} <span className="text-zinc-500">{perMonth}</span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                        <li>• {safeT("growthF1", undefined, "Advanced assistant controls")}</li>
                        <li>• {safeT("growthF2", undefined, "Team workflows + analytics (coming)")}</li>
                        <li>• {safeT("growthF3", undefined, "Priority support")}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Pro */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                    <div className="text-sm font-semibold text-zinc-100">
                      {safeT("planProTitle", undefined, "Aliigo Pro")}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {safeT("planProDesc", undefined, "Custom. Contact support to set it up.")}
                    </div>
                  </div>
                </div>


                {/* ✅ Manage / Cancel buttons (no logout here) */}
                {/* (3) Self-serve actions: upgrade / cancel / resume (no portal, no logout) */}
                {canManage ? (
                  <div className="pt-2 flex flex-wrap gap-3">
                    {/* Upgrade / downgrade */}
                    {billing?.plan === "starter" ? (
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
                              `Upgrade to Growth (${PRICE_GROWTH} ${perMonth})`
                            )}
                      </button>
                    ) : billing?.plan === "growth" ? (
                      <button
                        type="button"
                        onClick={() => runBillingAction("change_plan", "starter")}
                        disabled={portalLoading !== null}
                        className={btnNeutral}
                      >
                        {portalLoading === "change_plan"
                          ? safeT("loading", undefined, "Loading…")
                          : safeT(
                              "switchToStarter",
                              undefined,
                              `Switch to Starter (${PRICE_STARTER} ${perMonth})`
                            )}
                      </button>

                    ) : null}

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

            {/* Status debug line */}
            <div className="pt-2 text-xs text-zinc-500">
              {safeT("statusLabel", undefined, "Status:")}{" "}
              <span className="text-zinc-400">{status ?? "—"}</span>
            </div>
          </div>

          {/* Only show checkout when payment is actually needed */}
          {showCheckout ? (
            <div className="mt-6">
              <BillingCheckout jwt={jwt} />
            </div>
          ) : null}

          {/* ✅ keep support only */}
          <div className="mt-6">
            <a
              href="mailto:support@aliigo.com"
              className="inline-flex px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 hover:bg-zinc-900/60"
            >
              {safeT("contact", undefined, "Contact support")}
            </a>
          </div>
        </>
      )}
    </main>
  );
}
