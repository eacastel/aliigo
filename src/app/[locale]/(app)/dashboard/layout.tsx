// src/app/[locale]/(app)/dashboard/layout.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "../../../globals.css";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing"; 
import { supabase } from "@/lib/supabaseClient";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BillingGateProvider } from "@/components/BillingGateContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Navigation');
  const billingT = useTranslations("Billing");
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<"loading" | "active" | "inactive">("loading");

  const nav = [
    { href: "/dashboard", label: t('links.dashboard') },
    { href: "/dashboard/settings/business", label: t('links.business') },
    { href: "/dashboard/settings/assistant", label: t('links.assistant') },
    { href: "/dashboard/widget", label: t('links.widget') },
    { href: "/dashboard/messages", label: t('links.messages') },
    { href: "/dashboard/billing", label: t('links.billing') },
    { href: "/dashboard/help", label: t('links.help') },
  ] as const;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data.session;

      if (!s?.user) {
        router.replace({
          pathname: "/login",
          query: { redirect: "/dashboard" },
        });
        return;
      }

      setEmail(s.user.email ?? null);

      const token = s.access_token;

      const res = await fetch("/api/billing/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));

      const ok = res.ok && (j.status === "trialing" || j.status === "active");
      if (!cancelled) {
        setBillingStatus(ok ? "active" : "inactive");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); 
  };

  const billingActive = billingStatus === "active";
  const showBillingBanner =
    billingStatus === "inactive" && path !== "/dashboard/billing";

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">

      {/* HEADER */}
      <header className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 pb-4 pt-6 flex items-center justify-between">
          
          {/* LEFT: Just the Brand */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/aliigo-logo-white.svg" alt="Aliigo" width={120} height={36} priority />
            <span className="sr-only">Aliigo</span>
          </Link>

          {/* RIGHT: Actions + Switcher */}
          <nav className="flex items-center gap-4 text-sm">
            
            {/* ✅ MOVED SWITCHER HERE (Desktop) */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Link href="/dashboard" className="text-zinc-300 hover:text-white transition hidden sm:block">
              {t('actions.panel')}
            </Link>

            {email ? (
              <>
                <span className="text-zinc-500 text-xs hidden md:inline border-l border-zinc-800 pl-4 ml-2">
                  {email}
                </span>
                <button onClick={handleLogout} className="text-zinc-300 hover:text-white transition">
                  {t('actions.logout')}
                </button>
              </>
            ) : (
              <Link href="/login" className="text-zinc-300 hover:text-white">
                {t('actions.login')}
              </Link>
            )}

            
       {/* Mobile Switcher (Keep here for small screens) */}
            <div className="sm:hidden">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 grid grid-cols-12">
        {/* SIDEBAR */}
        <aside className="col-span-12 sm:col-span-3 lg:col-span-2 border-r border-zinc-800 bg-zinc-950">
          <div className="px-4 py-4 border-b border-zinc-800">
            <div className="text-xs text-zinc-500">{t('actions.sidebarTitle')}</div>
          </div>
          <nav className="p-3 space-y-1">
            {nav.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={[
                    "block px-3 py-2 rounded text-sm",
                    active
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-900/60",
                  ].join(" ")}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="col-span-12 sm:col-span-9 lg:col-span-10">
          <BillingGateProvider value={{ status: billingStatus, isActive: billingActive }}>
            <div className="max-w-6xl mx-auto px-4 py-6">
              {showBillingBanner && (
                <div className="mb-6 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="text-sm text-zinc-300">
                        {billingT("pending")}
                      </div>
                      <div className="font-semibold text-white">
                        {billingT("trialTitle")}
                      </div>
                      <div className="text-sm text-zinc-300">
                        {billingT("trialSubtitle")}
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-300 space-y-1">
                        <li>{billingT("trialBullet1")}</li>
                        <li>{billingT("trialBullet2")}</li>
                        <li>{billingT("trialBullet3")}</li>
                      </ul>
                    </div>
                    <div className="shrink-0">
                      <Link
                        href="/dashboard/billing"
                        className="inline-flex items-center justify-center rounded-xl bg-[#84c9ad] px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-[#73bba0] transition-colors"
                      >
                        {billingT("activateCta")}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              {children}
            </div>
          </BillingGateProvider>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-5 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Aliigo — {t('footer')}
        </div>
      </footer>
    </div>
  );
}
