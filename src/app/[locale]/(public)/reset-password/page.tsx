// src/app/[locale]/(public)/reset-password/page.tsx

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "@/i18n/routing"; 
import { useTranslations, useLocale } from "next-intl"; 

export default function ResetPasswordPage() {
  const t = useTranslations('Auth.reset'); 
  const locale = useLocale(); 
  
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleReset = async () => {
    setError("");
    const normalizedEmail = email.trim();
    
    if (!isValidEmail(normalizedEmail)) {
      setError(t('errorEmail'));
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/${locale}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 px-4 pb-20 relative">
      
      {/* 1. Background Glow (Teal) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-30 blur-[80px] pointer-events-none">
        <div className="w-[300px] h-[300px] bg-[#84c9ad] rounded-full mix-blend-screen" />
      </div>

      {/* 2. Title with Teal Gradient */}
      <h1 className="text-3xl font-bold text-center text-white mb-3 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
          {t('title')}
        </span>
      </h1>
      
      <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed max-w-xs mx-auto">
        {t('desc')}
      </p>

      {/* 3. Card with Teal Shadow */}
      <div className="bg-zinc-900/60 p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(132,201,173,0.1)] backdrop-blur-md">

        {sent ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-sm">
            <p>{t('success')}</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="sr-only" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
                  autoComplete="email"
                />
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-[#84c9ad] text-zinc-950 py-3.5 rounded-xl font-bold hover:bg-[#73bba0] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(132,201,173,0.15)] hover:shadow-[0_0_25px_rgba(132,201,173,0.3)] transform active:scale-[0.98]"
              >
                {loading ? t('loading') : t('submitButton')}
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <Link href="/login" className="text-sm font-medium text-[#84c9ad] hover:text-white transition-colors">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}