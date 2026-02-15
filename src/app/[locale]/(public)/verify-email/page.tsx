"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { pushToGTM } from "@/lib/gtm";

export default function VerifyEmailPage() {
  const t = useTranslations("Auth.verifyEmail");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        if (!cancelled) {
          setStatus("error");
          setError(t("missingToken"));
        }
        return;
      }

      const res = await fetch("/api/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok || body.ok !== true) {
        if (!cancelled) {
          setStatus("error");
          setError(typeof body.error === "string" ? body.error : t("failed"));
        }
        return;
      }

      const trackedKey = "aliigo_account_confirmed_tracked";
      if (typeof window !== "undefined" && !localStorage.getItem(trackedKey)) {
        pushToGTM("account_confirmed", {
          email: typeof body.email === "string" ? body.email : undefined,
          source: "custom_verify",
        });
        localStorage.setItem(trackedKey, "1");
      }

      if (!cancelled) setStatus("ok");

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace({ pathname: "/login", query: { from: "confirm" } });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, router, t, token]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
      {status === "loading" && <p className="mt-4 text-zinc-400">{t("loading")}</p>}
      {status === "ok" && <p className="mt-4 text-emerald-300">{t("success")}</p>}
      {status === "error" && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}

