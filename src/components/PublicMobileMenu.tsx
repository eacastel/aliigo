"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";

export default function PublicMobileMenu() {
  const t = useTranslations("Navigation");
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(!!data.session?.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("mobileMenu.open")}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
      >
        <span className="text-base leading-none">☰</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("mobileMenu.close")}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm border-l border-zinc-800 bg-zinc-950 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="text-sm font-semibold text-zinc-200">{t("mobileMenu.title")}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("mobileMenu.close")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                ×
              </button>
            </div>

            <nav className="py-5 space-y-4 text-sm">
              <Link href="/pricing" className="block text-zinc-300 hover:text-white" onClick={() => setOpen(false)}>
                {t("publicLinks.pricing")}
              </Link>
              <Link href="/why-aliigo" className="block text-zinc-300 hover:text-white" onClick={() => setOpen(false)}>
                {t("publicLinks.whyAliigo")}
              </Link>
              <Link href="/founder" className="block text-zinc-300 hover:text-white" onClick={() => setOpen(false)}>
                {t("publicLinks.founder")}
              </Link>
            </nav>

            <div className="mt-auto pt-4 border-t border-zinc-800">
              {isAuthed ? (
                <div className="space-y-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center rounded-lg bg-[#84c9ad] text-black px-4 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-colors"
                  >
                    {t("actions.panel")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={busy}
                    className="block w-full text-center rounded-lg border border-zinc-700 text-zinc-200 px-4 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors disabled:opacity-60"
                  >
                    {busy ? t("actions.loggingOut") : t("actions.logout")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center rounded-lg bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-[#84c9ad] transition-colors"
                >
                  {t("actions.login")}
                </Link>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

