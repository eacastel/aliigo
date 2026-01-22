"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";

type BillingStatus = "incomplete" | "trialing" | "active" | "canceled" | "past_due";

export default function BillingPage() {
  const t = useTranslations("Billing");
  const router = useRouter();

  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch("/api/billing/status", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const j = await res.json().catch(() => ({}));
        if (!cancelled) setStatus((j.status as BillingStatus) ?? "incomplete");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const showConfirmStep = emailConfirmed === false;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>

      {loading ? (
        <p className="text-zinc-300">{t("loading")}</p>
      ) : (
        <>
          {/* Main message */}
          <p className="text-zinc-300 mb-6">
            {emailConfirmed ? t("pending") : t("pendingUnconfirmed")}
          </p>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-2 text-sm text-zinc-200">
            {showConfirmStep && <div>{t("step1")}</div>}
            <div>{t("step2")}</div>
            <div>{t("step3")}</div>

            {/* Optional: show status for sanity */}
            <div className="pt-3 text-xs text-zinc-500">
              {t("statusLabel")} <span className="text-zinc-400">{status ?? "—"}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href="mailto:support@aliigo.com"
              className="px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 hover:bg-zinc-900/60"
            >
              {t("contact")}
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-zinc-800 text-sm text-zinc-200 hover:bg-zinc-900/60"
            >
              {t("logout")}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
