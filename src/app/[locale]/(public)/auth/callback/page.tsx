// src/app/[locale]/(public)/auth/callback/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const t = useTranslations("Auth.callback");

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        const { data: s } = await supabase.auth.getSession();

        if (error || !s.session) {
          console.error("Auth callback error:", error?.message);
          router.replace(`/${locale}/login`);
          return;
        }

        router.replace(`/${locale}/dashboard/billing`);
      } catch (e) {
        console.error("Auth callback unexpected error:", e);
        router.replace(`/${locale}/login`);
      }
    })();
  }, [router, locale]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-sm text-gray-400">{t("loading")}</p>
    </div>
  );
}
