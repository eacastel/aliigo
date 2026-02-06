"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function UpdatePasswordPage() {
  const t = useTranslations('Auth.update');
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (password.length < 6) {
      setError(t('errorLength'));
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Success: Redirect to dashboard
      // You could also show a success toast here if you have one
      router.replace("/dashboard"); 
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 px-4 pb-20 relative">
      
      {/* 1. Background Glow (Teal) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-30 blur-[80px] pointer-events-none">
        <div className="w-[300px] h-[300px] bg-[#84c9ad] rounded-full mix-blend-screen" />
      </div>

      {/* 2. Gradient Title */}
      <h1 className="text-3xl font-bold text-center text-white mb-3 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
          {t('title')}
        </span>
      </h1>
      
      <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed max-w-xs mx-auto">
        {t('desc')}
      </p>

      {/* 3. Card Container */}
      <div className="bg-zinc-900/60 p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(132,201,173,0.1)] backdrop-blur-md">

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center"
          >
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="update-password"
              className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide"
            >
              {t('passwordLabel')}
            </label>
            <input
                id="update-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
                autoComplete="new-password"
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-[#84c9ad] text-zinc-950 py-3.5 rounded-xl font-bold hover:bg-[#73bba0] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(132,201,173,0.15)] hover:shadow-[0_0_25px_rgba(132,201,173,0.3)] transform active:scale-[0.98]"
          >
            {loading ? "..." : t('submitButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
