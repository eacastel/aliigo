// /app/[locale]/(public)/signup/page.tsx

"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import { getMetaBrowserIDs } from "@/lib/metaHelpers";

const pushToGTM = (event: string, data?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;

  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  
  if (w.dataLayer) {
    w.dataLayer.push({ event, ...data });
  }
};

export default function SignupPage() {
  const t = useTranslations('Auth.signup');
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fireLeadCAPIEvent = async (userEmail: string) => {
    try {
      const { fbc, fbp } = getMetaBrowserIDs();
      await fetch('/api/meta-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'Lead',
          email: userEmail,
          fbc: fbc,
          fbp: fbp,
        }),
      });
    } catch (e) {
      console.error("CAPI Error:", e);
    }
  };

  async function ensureBusinessProfile(input: {
    id: string;
    email: string;
    name?: string;
    businessName: string;
    phone?: string;
    googleUrl?: string;
  }) {
    const res = await fetch("/api/profiles/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: input.id,
        email: input.email,
        full_name: input.name || null,
        business_name: input.businessName,
        phone: input.phone || null,
        google_url: input.googleUrl || null,
        source: "signup",
      }),
    });

    const raw: unknown = await res.json().catch(() => ({}));
    const j = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};


    if (!res.ok) {
      const err = typeof j.error === "string" ? j.error : "";
      const msg = err || `profiles/ensure failed (${res.status})`;
      throw new Error(msg);
    }

    return j;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !businessName.trim() || !password) {
      setError(t('errorValidation'));
      return;
    }
    if (password.length < 6) {
      setError(t('errorPassword'));
      return;
    }

    setLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name,
          business_name: businessName,
          google_url: googleUrl,
          phone: phone
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    
    const userId = user?.id;
    if (!userId) {
      setError("No se pudo obtener el usuario después del registro.");
      setLoading(false);
      return;
    }


    try {
      await ensureBusinessProfile({
        id: userId,
        email,
        name,
        businessName,
        phone,
        googleUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el negocio/perfil.");
      setLoading(false);
      return;
    }

    // Success Handling
    if (user) {
      // 1. Fire Server CAPI
      void fireLeadCAPIEvent(email);
      
      // 2. Fire Browser GTM
      pushToGTM('generate_lead', { 
        email: email, 
        source: 'signup_form' 
      });
    }

    localStorage.setItem('aliigo_pending_signup', JSON.stringify({ email, businessName }));
    router.push('/check-email');
  };

  return (
    <div className="max-w-lg mx-auto mt-12 px-4 pb-20 relative">
      
      {/* 1. Background Glow Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-30 blur-[80px] pointer-events-none">
        <div className="w-[300px] h-[300px] bg-[#84c9ad] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#84c9ad]">
            {t('introTitle')}
          </span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
          {t('introText')}
        </p>
      </div>

      {/* Card Container */}
      <form 
        onSubmit={handleSubmit} 
        className="space-y-5 bg-zinc-900/60 p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_-10px_rgba(132,201,173,0.1)] backdrop-blur-md"
      >
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('emailPlaceholder')}</label>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
            required
            />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('namePlaceholder')}</label>
            <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
            />
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('businessPlaceholder')}</label>
            <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
            required
            />
        </div>

        {/* Google URL */}
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('googleUrlPlaceholder')}</label>
            <input
            type="text" 
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('phonePlaceholder')}</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
                />
            </div>
            
            {/* Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 ml-1 uppercase tracking-wide">{t('passwordPlaceholder')}</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 text-white px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-[#84c9ad] focus:ring-1 focus:ring-[#84c9ad] transition-all placeholder:text-zinc-600"
                    required
                />
            </div>
        </div>

        {/* CTA Button */}
        <button
          type="submit"
          className="w-full bg-[#84c9ad] text-zinc-950 py-3.5 rounded-xl font-bold hover:bg-[#73bba0] disabled:opacity-50 transition-all mt-4 shadow-[0_0_20px_rgba(132,201,173,0.15)] hover:shadow-[0_0_25px_rgba(132,201,173,0.3)] transform active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? t('loading') : t('submitButton')}
        </button>

        <p className="text-[10px] text-zinc-500 text-center leading-normal px-4 pt-2">
          {t('disclaimer')}
        </p>

        <div className="border-t border-white/10 pt-6 mt-6 text-center">
            <p className="text-sm text-zinc-400">
            {t('alreadyAccount')}{" "}
            <Link href="/login" className="text-[#84c9ad] hover:text-white transition-colors font-medium ml-1">
                {t('signInLink')}
            </Link>
            </p>
        </div>
      </form>
    </div>
  );
}