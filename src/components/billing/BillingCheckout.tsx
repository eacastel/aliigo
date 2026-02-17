"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementsOptionsClientSecret } from "@stripe/stripe-js";
import PlanSelector from "./PlanSelector";
import PaymentForm from "./PaymentForm";
import type { AliigoCurrency } from "@/lib/currency";
import { useLocale, useTranslations } from "next-intl";

export type Plan = "basic" | "growth" | "pro";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BillingCheckout({ jwt, currency }: { jwt: string; currency: AliigoCurrency }) {
  const [plan, setPlan] = useState<Plan>("basic");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const locale = useLocale();
  const t = useTranslations("Billing");

  useEffect(() => {
    if (!jwt) return;

    (async () => {
      setErr("");
      const res = await fetch("/api/stripe/setup-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({}),
      });

      const j = (await res.json().catch(() => ({}))) as {
        clientSecret?: string;
        error?: string;
      };

      if (!res.ok || !j.clientSecret) {
        setErr(j.error || "Failed to create setup intent");
        return;
      }
      setClientSecret(j.clientSecret);
    })();
  }, [jwt]);

  const options = useMemo<StripeElementsOptionsClientSecret | undefined>(() => {
    if (!clientSecret) return undefined;

    return {
      clientSecret,
      locale: locale === "es" ? "es" : "en",
      // Keep it clean + dark and avoid the huge “wallet list”
      paymentMethodOrder: ["card"],
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#84c9ad",
          colorBackground: "transparent",
          colorText: "#ffffff",
          colorTextSecondary: "#a1a1aa",
          colorDanger: "#f87171",
          borderRadius: "14px",
          spacingUnit: "4px",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
        },
        rules: {
          ".Input": {
            backgroundColor: "rgba(0,0,0,0)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "none",
          },
          ".Input:focus": {
            border: "1px solid rgba(132,201,173,0.75)",
            boxShadow: "0 0 0 1px rgba(132,201,173,0.35)",
          },
          ".Label": { color: "rgba(161,161,170,1)" },
          ".Block": {
            backgroundColor: "rgba(0,0,0,0)",
            border: "1px solid rgba(255,255,255,0.10)",
          },
          ".Tab": {
            backgroundColor: "rgba(0,0,0,0)",
            border: "1px solid rgba(255,255,255,0.10)",
          },
        },
      },
    };
  }, [clientSecret]);

  if (!options) {
    return (
      <div className="text-sm text-zinc-300">
        {err ? <span className="text-red-400">{err}</span> : t("checkoutLoading", undefined, { default: "Preparing secure payment form…" } as never)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PlanSelector value={plan} onChange={setPlan} locale={locale} currency={currency} />

      <Elements stripe={stripePromise} options={options}>
        <PaymentForm jwt={jwt} plan={plan} currency={currency} />
      </Elements>

      <div className="text-xs text-zinc-500">{t("checkoutFooter")}</div>
    </div>
  );
}
