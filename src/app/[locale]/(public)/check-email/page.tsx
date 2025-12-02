"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function CheckEmailPage() {
  const t = useTranslations('Auth.checkEmail');

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* 1. Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#84c9ad] rounded-full mix-blend-screen opacity-10 blur-[100px] pointer-events-none" />

      {/* 2. Success Icon */}
      <div className="mb-8 relative">
        <div className="w-20 h-20 bg-[#84c9ad]/20 rounded-full flex items-center justify-center border border-[#84c9ad]/30 shadow-[0_0_30px_rgba(132,201,173,0.2)]">
          <svg className="w-10 h-10 text-[#84c9ad]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* 3. Main Card */}
      <div className="max-w-lg w-full bg-zinc-900/60 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center">
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-[#84c9ad] font-medium mb-6">
          {t('subtitle')}
        </p>

        <div className="text-sm text-zinc-300 space-y-4 leading-relaxed mb-8">
          <p>{t('desc1')}</p>
          <p>{t('desc2')}</p>
          
          {/* Checklist */}
          <ul className="bg-zinc-950/50 rounded-xl p-4 text-left space-y-3 border border-white/5">
            {[1, 2, 3].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-[#84c9ad] mt-0.5">✓</span>
                <span className="text-zinc-200">{t(`list${item}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-zinc-500 mb-3">
            {t('footer')}
          </p>
          <Link href="/" className="text-sm font-semibold text-white hover:text-[#84c9ad] transition-colors">
            ← {t('backLink')}
          </Link>
        </div>

      </div>
    </div>
  );
}