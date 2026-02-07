"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Plan } from "./BillingCheckout";
import type { AliigoCurrency } from "@/lib/currency";

export default function PaymentForm({
  jwt,
  plan,
  currency,
}: {
  jwt: string;
  plan: Plan;
  currency: AliigoCurrency;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        setErr(result.error.message || "Payment failed");
        return;
      }

      const setupIntentId = result.setupIntent?.id;
      if (!setupIntentId) {
        setErr("Missing setup intent id");
        return;
      }

      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ plan, setup_intent_id: setupIntentId, currency }),
      });

      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error || "Subscription failed");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
        <PaymentElement />
      </div>

      {err ? <div className="text-sm text-red-400">{err}</div> : null}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full bg-[#84c9ad] text-zinc-950 py-3.5 rounded-xl font-bold hover:bg-[#73bba0] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(132,201,173,0.15)] hover:shadow-[0_0_25px_rgba(132,201,173,0.3)]"
      >
        {loading ? "Processing…" : "Start free trial"}
      </button>
    </form>
  );
}
