"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";

export default function PublicAuthActions({
  className = "",
}: {
  className?: string;
}) {
  const t = useTranslations("Navigation");
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

  const handleLogout = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className={className}>
        <Link
          href="/login"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          {t("actions.login")}
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link
        href="/dashboard"
        className="text-zinc-300 hover:text-white transition-colors"
      >
        {t("actions.panel")}
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="text-zinc-400 hover:text-white transition-colors disabled:opacity-60"
      >
        {busy ? t("actions.loggingOut") : t("actions.logout")}
      </button>
    </div>
  );
}
