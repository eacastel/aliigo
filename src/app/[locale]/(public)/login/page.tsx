// src/app/[locale]/(public)/login/page.tsx

"use client";

import React, { Suspense, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { AuthError } from "@supabase/supabase-js";
import { useTranslations, useLocale } from "next-intl";
import { getMetaBrowserIDs } from '@/lib/metaHelpers'; 

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950" />}>
      <LoginWithSearchParams />
    </Suspense>
  );
}

function LoginWithSearchParams() {
  const t = useTranslations('Auth.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from"); 
  const locale = useLocale();

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // CAPI Logic
  const fireLoginEvent = async (normalizedEmail: string) => {
    try {
      const { fbc, fbp } = getMetaBrowserIDs();
      await fetch('/api/meta-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'LogIn',
          email: normalizedEmail,
          fbc, fbp,
        }),
      });
    } catch (e) {
      console.error("CAPI Error:", e);
    }
  };

  const handleLogin = async () => {
    setMsg(null);
    setCanResend(false); 

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setMsg({ type: "error", text: t('msgValidation') });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (error) {
        const e = error as AuthError;
        if (e.status === 422) {
          setCanResend(true);
          setMsg({ type: "error", text: t('msgUnconfirmed') });
        } else if (e.status === 429) {
          setMsg({ type: "error", text: t('msgTooManyRequests') });
        } else {
          setMsg({ type: "error", text: t('msgInvalidCreds') });
        }
        return;
      }

      // Success
      void fireLoginEvent(normalizedEmail);
      const redirect = searchParams.get("redirect") || "/dashboard";

      // 1) Get access token from the session (client must send it)
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      
      if (!token) {
        // Should be rare after successful sign-in, but fail closed
        router.push("/login");
        return;
      }

      // 2) Ask server if user is already trialing/active
      const res = await fetch("/api/billing/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));
      const ok = res.ok && (j.status === "trialing" || j.status === "active");

      // 3) Route based on billing gate
      router.push(ok ? redirect : "/dashboard/billing");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setMsg(null);
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${origin}/${locale}/auth/callback` }, 
      });

      if (error) {
        setMsg({ type: "error", text: t('msgResendError') });
      } else {
        setMsg({ type: "ok", text: t('msgResendSuccess') });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 px-4 pb-20 relative">
      
      {/* 1. Background Glow (Teal) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-30 blur-[80px] pointer-events-none">
        <div className="w-[300px] h-[300px] bg-[#84c9ad] rounded-full mix-blend-screen" />
      </div>

      {from === "confirm" && (
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center text-sm">
          {t('okVerified')}
        </div>
      )}

      {/* 2. Title with Teal Gradient */}
      <h1 className="text-3xl font-bold text-center text-white mb-8 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
          {t('title')}
        </span>
      </h1>

      {/* 3. Card with Teal Shadow */}
      <div className="space-y-6 bg-zinc-900/60 p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(132,201,173,0.1)] backdrop-blur-md">
        
        {msg && (
          <div
            role={msg.type === "error" ? "alert" : "status"}
            aria-live={msg.type === "error" ? "assertive" : "polite"}
            className={`p-3 rounded-lg text-sm text-center border ${
            msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide"
            >
              {t('emailLabel')}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
            />
        </div>

        <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide"
            >
              {t('passwordLabel')}
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
            />
        </div>

        {/* 4. Button with Teal Background & Shadow */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#84c9ad] text-zinc-950 py-3.5 rounded-xl font-bold hover:bg-[#73bba0] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(132,201,173,0.15)] hover:shadow-[0_0_25px_rgba(132,201,173,0.3)] transform active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? t('loading') : t('submitButton')}
        </button>

        {canResend && (
          <button
            onClick={handleResendConfirmation}
            className="w-full py-2 text-sm text-[#84c9ad] hover:text-white transition-colors"
            disabled={resending}
          >
            {resending ? t('resending') : t('resendButton')}
          </button>
        )}

        <p className="text-sm text-zinc-500 text-center pt-2">
          {t('forgotPassword')}{" "}
          <Link href="/reset-password" className="text-[#84c9ad] hover:text-white transition-colors font-medium ml-1">
            {t('resetLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
