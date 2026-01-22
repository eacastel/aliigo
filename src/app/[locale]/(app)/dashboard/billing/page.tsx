"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";

export default function BillingPage() {
  const t = useTranslations("Billing");
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-3">{t("title")}</h1>

      <p className="text-zinc-300 mb-6">{t("pending")}</p>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-3">
        <p className="text-sm text-zinc-300">{t("step1")}</p>
        <p className="text-sm text-zinc-300">{t("step2")}</p>
        <p className="text-sm text-zinc-300">{t("step3")}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="mailto:support@aliigo.com?subject=Aliigo%20billing%20activation"
          className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 transition text-sm"
        >
          {t("contact")}
        </a>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-transparent text-zinc-300 border border-zinc-800 hover:bg-zinc-900 transition text-sm"
        >
          {t("logout")}
        </button>
      </div>
    </main>
  );
}
