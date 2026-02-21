// src/app/[locale]/(app)/dashboard/layout.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "../../../globals.css";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing"; 
import { supabase } from "@/lib/supabaseClient";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BillingGateProvider } from "@/components/BillingGateContext";
import { HomeFloatingWidgetGate } from "@/components/home/FloatingWidgetGate";

const UNVERIFIED_LAST_24H_THRESHOLD = 24;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const billingT = useTranslations("Billing");
  const dashboardT = useTranslations("Dashboard");
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<"loading" | "active" | "inactive">("loading");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [billingRawStatus, setBillingRawStatus] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationDeadline, setVerificationDeadline] = useState<string | null>(null);
  const [showVerifyDetails, setShowVerifyDetails] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  const nav = [
    { href: "/dashboard", label: t('links.dashboard') },
    { href: "/dashboard/settings/business", label: t('links.business') },
    { href: "/dashboard/settings/assistant", label: t('links.assistant') },
    { href: "/dashboard/widget", label: t('links.widget') },
    { href: "/dashboard/messages", label: t('links.messages') },
    { href: "/dashboard/billing", label: t('links.billing') },
    { href: "/dashboard/widget/advanced", label: t('links.advanced') },
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

      const { data: profile, error: profileErr } = await supabase
        .from("business_profiles")
        .select("email, email_verified_at, email_verification_deadline")
        .eq("id", s.user.id)
        .maybeSingle();

      if (!profileErr && !cancelled) {
        const profileEmail =
          typeof profile?.email === "string" ? profile.email.trim() : null;
        if (!s.user.email && profileEmail) {
          setEmail(profileEmail);
        }
        setIsVerified(Boolean(profile?.email_verified_at));
        setVerificationDeadline(profile?.email_verification_deadline ?? null);
      }

      const token = s.access_token;

      const res = await fetch("/api/billing/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));

      const ok = res.ok && (j.status === "trialing" || j.status === "active");
      if (!cancelled) {
        setBillingStatus(ok ? "active" : "inactive");
        setBillingRawStatus(typeof j.status === "string" ? j.status : null);
        setTrialEndsAt(typeof j.trial_end === "string" ? j.trial_end : null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const unverifiedHoursRemaining = useMemo(() => {
    if (isVerified !== false || !verificationDeadline) return null;
    return Math.floor((new Date(verificationDeadline).getTime() - Date.now()) / 3_600_000);
  }, [isVerified, verificationDeadline]);

  const handleResendVerification = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/verification/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ purpose: "signup", locale }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || body.ok !== true) {
      alert(
        dashboardT("resendError", {
          error: typeof body.error === "string" ? body.error : "Unexpected error",
        })
      );
      return;
    }
    alert(dashboardT("resendSuccess"));
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); 
  };

  const billingActive = billingStatus === "active";
  const trialDaysLeft = useMemo(() => {
    if (billingRawStatus !== "trialing" || !trialEndsAt) return null;
    const end = Date.parse(trialEndsAt);
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [billingRawStatus, trialEndsAt]);
  const showBillingBanner =
    billingStatus === "inactive" && path !== "/dashboard/billing";
  const showTrialBanner = billingRawStatus === "trialing";
  const showVerificationBanner = isVerified === false;

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
            <div className="max-w-5xl mx-auto px-4 py-6">
              {showVerificationBanner && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-amber-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                      <div className="min-w-0">
                      <h3 className="text-sm font-medium text-zinc-100">
                        {dashboardT("verifyTitle")}
                      </h3>
                        <p className="mt-1 text-sm text-zinc-300 line-clamp-2">
                          {dashboardT("verifyMessage", { email: email ?? "" })}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVerifyDetails((v) => !v)}
                        className="rounded-md border border-amber-300/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-300/10"
                      >
                        {showVerifyDetails
                          ? dashboardT("bannerDetailsHide")
                          : dashboardT("bannerDetailsShow")}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="rounded-md bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-300/20 hover:bg-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                      >
                        {dashboardT("resendButton")}
                      </button>
                    </div>
                  </div>

                  {showVerifyDetails ? (
                    <div className="mt-3 border-t border-amber-300/20 pt-3 text-sm text-zinc-300">
                        {unverifiedHoursRemaining !== null &&
                          unverifiedHoursRemaining > UNVERIFIED_LAST_24H_THRESHOLD && (
                            <p className="mt-1">
                              {dashboardT("verifyCountdownDays", { hours: unverifiedHoursRemaining })}
                            </p>
                          )}
                        {unverifiedHoursRemaining !== null &&
                          unverifiedHoursRemaining > 0 &&
                          unverifiedHoursRemaining <= UNVERIFIED_LAST_24H_THRESHOLD && (
                            <p className="mt-1 text-amber-200">
                              {dashboardT("verifyCountdownLast24h", {
                                hours: unverifiedHoursRemaining,
                              })}
                            </p>
                          )}
                        {unverifiedHoursRemaining !== null && unverifiedHoursRemaining <= 0 && (
                          <p className="mt-1 text-red-200">{dashboardT("verifyCountdownExpired")}</p>
                        )}
                    </div>
                  ) : null}
                </div>
              )}
              {showBillingBanner && (
                <div className="mb-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-300">
                        {billingT("pending")}
                      </div>
                      <div className="font-semibold text-white mt-1">
                        {billingT("trialTitle")}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBillingDetails((v) => !v)}
                        className="rounded-md border border-emerald-300/25 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-300/10"
                      >
                        {showBillingDetails
                          ? dashboardT("bannerDetailsHide")
                          : dashboardT("bannerDetailsShow")}
                      </button>
                      <Link
                        href="/dashboard/billing"
                        className="inline-flex items-center justify-center rounded-xl bg-[#84c9ad] px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-[#73bba0] transition-colors"
                      >
                        {billingT("activateCta")}
                      </Link>
                    </div>
                  </div>

                  {showBillingDetails ? (
                    <div className="mt-3 border-t border-emerald-300/15 pt-3">
                      <div className="text-sm text-zinc-300">
                        {billingT("trialSubtitle")}
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-300 space-y-1">
                        <li>{billingT("trialBullet1")}</li>
                        <li>{billingT("trialBullet2")}</li>
                        <li>{billingT("trialBullet3")}</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
              {showTrialBanner && (
                <div
                  className="mb-4 rounded-xl border p-4"
                  style={{
                    borderColor: "lab(55% -12.85 3.72 / 0.45)",
                    backgroundColor: "lab(55% -12.85 3.72 / 0.08)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs" style={{ color: "lab(55% -12.85 3.72)" }}>
                        {billingT("trialTitle")}
                      </div>
                      <div className="text-sm text-zinc-300 mt-1">
                        {trialDaysLeft !== null
                          ? billingT("daysLeft", { count: trialDaysLeft })
                          : billingT("trialSubtitle")}
                      </div>
                    </div>

                    <Link href="/dashboard/billing" className="rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-zinc-700 text-zinc-100 hover:bg-zinc-900/40">
                      {billingT("choosePlanCta")}
                    </Link>
                  </div>
                </div>
              )}
              {children}
            </div>
          </BillingGateProvider>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl grid gap-8 md:grid-cols-2 md:gap-14">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerCompany.title")}
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/why-aliigo" className="hover:text-white transition-colors">{t("footerCompany.whyAliigo")}</Link></li>
                <li><Link href="/founder" className="hover:text-white transition-colors">{t("footerCompany.founder")}</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white transition-colors">{t("footerCompany.privacy")}</Link></li>
                <li><Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerCompany.dataDeletion")}</Link></li>
                <li><Link href="/legal/dpa" className="hover:text-white transition-colors">{t("footerCompany.dpa")}</Link></li>
                <li><Link href="/legal/subprocessors" className="hover:text-white transition-colors">{t("footerCompany.subprocessors")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("footerLinks.title")}
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="/legal/aviso-legal" className="hover:text-white transition-colors">{t("footerLinks.avisoLegal")}</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white transition-colors">{t("footerLinks.cookies")}</Link></li>
                <li><Link href="/legal/terminos" className="hover:text-white transition-colors">{t("footerLinks.terminos")}</Link></li>
                <li><Link href="/legal/eliminacion-datos" className="hover:text-white transition-colors">{t("footerLinks.dataDeletion")}</Link></li>
                <li><Link href="/legal/subscription-agreement" className="hover:text-white transition-colors">{t("footerLinks.subscriptionAgreement")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Aliigo — {t("footer")}
          </div>
        </div>
      </footer>

      <HomeFloatingWidgetGate />
    </div>
  );
}
