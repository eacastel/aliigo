// src/app/[locale]/(public)/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import { useTranslations, useLocale } from "next-intl";

function getHashParams() {
  const hash = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const t = useTranslations("Auth.callback");
  const locale = useLocale();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/dashboard";

        // Support both new (code=) and old (hash access_token) flows
        const hasCode = url.searchParams.has("code");
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            console.error("exchangeCodeForSession error:", error.message);
            router.replace("/login");
            return;
          }
        } else {
          // For #access_token links, supabase-js usually picks up the session automatically.
          // Touch session so it finalizes.
          await supabase.auth.getSession();
        }

        const hashParams = getHashParams();
        const type = hashParams.get("type") || url.searchParams.get("type");

        // Recovery should go to update-password
        if (type === "recovery") {
          router.replace({ pathname: "/update-password" });
          return;
        }

        if (type === "signup") {
          try {
            const trackedKey = "aliigo_account_confirmed_tracked";
            const alreadyTracked =
              typeof window !== "undefined" && window.sessionStorage.getItem(trackedKey) === "1";
            if (!alreadyTracked) {
              const { data } = await supabase.auth.getSession();
              if (data.session) {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                  event: "account_confirmed",
                  locale,
                });
                window.sessionStorage.setItem(trackedKey, "1");
              }
            }
          } catch (e) {
            console.warn("Account confirmed tracking failed:", e);
          }

          try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (token) {
              await fetch("/api/auth/welcome", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ locale }),
              });
            }
          } catch (e) {
            console.warn("Welcome email send failed:", e);
          }
        }

        // Default: go to whatever caller requested (or login)
        if (next.startsWith("/")) {
          window.location.assign(next);
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error("Auth callback unexpected error:", e);
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-sm text-gray-400">{t("loading")}</p>
    </div>
  );
}
