import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import HeroRotator from "@/components/HeroRotator";
import { AliigoSupportWidget } from "@/components/AliigoSupportWidget";

export default function HomePage() {
  const t = useTranslations('Landing');

  return (
    <div className="bg-zinc-950 overflow-hidden selection:bg-[#84c9ad]/30">
      
      {/* 1. HERO SECTION WITH GRADIENT MESH */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-white/5">
        {/* Teal Gradient Blob */}
        <div className="absolute top-0 right-0 -z-10 opacity-20 blur-[100px] pointer-events-none">
          <div className="w-[500px] h-[500px] bg-[#84c9ad] rounded-full mix-blend-screen" />
        </div>
        
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84c9ad]/10 border border-[#84c9ad]/20 text-[#84c9ad] text-xs font-medium mb-6">
                ✨ {t('hero.betaNote')}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                {t('hero.title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84c9ad] to-emerald-400">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-lg">
                {t('hero.subtitle')}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] text-black px-6 py-3 text-sm font-semibold hover:bg-[#73bba0] transition-all shadow-[0_0_20px_rgba(132,201,173,0.3)]"
                >
                  {t('hero.ctaPrimary')}
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </div>
            </div>

            {/* Right Visual (Rotator) */}
            <div className="relative">
              <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-white/10">
                <HeroRotator />
              </div>
              {/* Decorative Elements */}
              <div className="absolute -inset-1 -z-10 bg-gradient-to-tr from-[#84c9ad] to-blue-600 opacity-20 blur-xl rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF (Ticker Tape Style) */}
      <section className="border-b border-white/5 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-center text-sm font-medium text-zinc-500 mb-6 uppercase tracking-wider">
            {t('socialProof.title')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Clínicas", "Escuelas", "Estética", 
              "Fisioterapia", "Legal", "Dental"
            ].map((tag, i) => (
              <span 
                key={i} 
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-zinc-300 text-sm font-medium hover:bg-white/10 hover:border-[#84c9ad]/30 hover:text-[#84c9ad] transition-all cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID FEATURES (Replacing the vertical list) */}
      <section className="py-24 bg-zinc-950 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t('features.title')}</h2>
            <p className="text-zinc-400">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
            
            {/* Big Card (AI Web Chat) */}
            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 relative overflow-hidden group hover:border-[#84c9ad]/30 transition-all flex flex-col justify-between">
              
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                <div className="w-32 h-32 bg-[#84c9ad] blur-[60px] rounded-full" />
              </div>

              {/* Text Content */}
              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{t('features.f1.title')}</h3>
                <p className="text-zinc-400 max-w-sm">{t('features.f1.desc')}</p>
              </div>

              {/* ✨ VISUAL: Simulated Chat UI */}
              <div className="relative w-full max-w-md ml-auto mt-auto translate-y-4 translate-x-4">
                <div className="w-full bg-zinc-950 border border-white/10 rounded-tl-xl rounded-tr-xl shadow-2xl p-4 space-y-3">
                  
                  {/* Message 1: Incoming (Customer) */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 text-xs text-zinc-300">
                      <div className="h-2 w-24 bg-zinc-700 rounded mb-1.5 opacity-50"></div>
                      <div className="h-2 w-16 bg-zinc-700 rounded opacity-50"></div>
                    </div>
                  </div>

                  {/* Message 2: Outgoing (Aliigo AI) */}
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[#84c9ad] flex items-center justify-center text-zinc-900 text-[10px] font-bold flex-shrink-0">
                      AI
                    </div>
                    <div className="bg-[#84c9ad]/10 border border-[#84c9ad]/20 rounded-2xl rounded-tr-none px-4 py-2 text-xs text-[#84c9ad]">
                      <div className="h-2 w-32 bg-[#84c9ad] rounded mb-1.5 opacity-40"></div>
                      <div className="h-2 w-20 bg-[#84c9ad] rounded opacity-40"></div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <div className="h-8 flex-1 bg-zinc-900 rounded-full border border-white/5" />
                    <div className="h-8 w-8 bg-[#84c9ad] rounded-full opacity-20" />
                  </div>

                </div>
              </div>
            </div>

            {/* Tall Card (Reviews) */}
            <div className="md:row-span-2 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                <div className="w-32 h-32 bg-yellow-500 blur-[60px] rounded-full" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('features.f3.title')}</h3>
              <p className="text-zinc-400">{t('features.f3.desc')}</p>
               <div className="mt-8 space-y-3">
                  {[5,5,4].map((stars, i) => (
                    <div key={i} className="p-3 bg-zinc-950/50 rounded-lg border border-white/5">
                      <div className="flex gap-1 text-yellow-500 text-xs mb-1">{"★".repeat(stars)}</div>
                      <div className="h-2 w-20 bg-zinc-800 rounded mb-1" />
                      <div className="h-2 w-12 bg-zinc-800 rounded" />
                    </div>
                  ))}
               </div>
            </div>

            {/* Small Card (Inbox) */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 hover:bg-zinc-900 transition-all">
               <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                 📥
               </div>
               <h3 className="text-xl font-bold text-white mb-2">{t('features.f2.title')}</h3>
               <p className="text-zinc-400 text-sm">{t('features.f2.desc')}</p>
            </div>

            {/* Small Card (Campaigns) */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 hover:bg-zinc-900 transition-all">
               <div className="w-10 h-10 rounded-lg bg-[#84c9ad]/20 flex items-center justify-center text-[#84c9ad] mb-4">
                 🚀
               </div>
               <h3 className="text-xl font-bold text-white mb-2">{t('features.f4.title')}</h3>
               <p className="text-zinc-400 text-sm">{t('features.f4.desc')}</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PRICING (Card Highlight) */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="rounded-3xl bg-zinc-900 border border-white/10 p-1 lg:p-2 flex flex-col md:flex-row gap-8 items-center overflow-hidden">
            
            {/* Visual Side */}
            <div className="flex-1 p-8 md:p-12 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-4">{t('pricing.title')}</h2>
              <p className="text-zinc-400 mb-6">{t('pricing.desc')}</p>
              <ul className="space-y-3 text-sm text-zinc-300 text-left mx-auto max-w-xs md:mx-0">
                <li className="flex items-center gap-2"><span className="text-[#84c9ad]">✓</span> 1 User Included</li>
                <li className="flex items-center gap-2"><span className="text-[#84c9ad]">✓</span> AI Chatbot (Unlimited)</li>
                <li className="flex items-center gap-2"><span className="text-[#84c9ad]">✓</span> Google Review Sync</li>
              </ul>
            </div>

            {/* Price Side */}
            <div className="w-full md:w-80 bg-[#84c9ad] rounded-2xl p-8 text-center text-zinc-900 flex flex-col justify-center min-h-[300px]">
              <div className="text-sm font-bold uppercase tracking-wide opacity-80 mb-2">Beta Access</div>
              <div className="text-6xl font-extrabold mb-1">{t('pricing.price')}</div>
              <div className="opacity-80 mb-8 font-medium">{t('pricing.period')}</div>
              <Link href="/signup" className="block w-full py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                {t('pricing.cta')}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Restored & Redesigned) */}
      <section id="how-it-works" className="py-24 bg-zinc-900/30 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t('howItWorks.title')}</h2>
            <p className="text-zinc-400">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative group">
                {/* Connecting Line (Desktop only) */}
                {step !== 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-zinc-800 to-zinc-900 z-0" />
                )}
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-lg group-hover:border-[#84c9ad]/50 group-hover:text-[#84c9ad] transition-all duration-300">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {t(`howItWorks.step${step}.title`)}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed px-4">
                    {t(`howItWorks.step${step}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ (Restored & Redesigned) */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">{t('faq.title')}</h2>
          
          <div className="space-y-4">
            {['q1', 'q2', 'q3', 'q4'].map((q) => (
              <div key={q} className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6 hover:bg-zinc-900/40 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-start gap-3">
                  <span className="text-[#84c9ad] mt-1">?</span>
                  {t(`faq.${q}.q`)}
                </h3>
                <p className="text-zinc-400 text-sm pl-7 leading-relaxed">
                  {t(`faq.${q}.a`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">{t('finalCta.title')}</h2>
        <Link
           href="/signup"
           className="inline-flex items-center justify-center rounded-lg bg-white text-black px-8 py-4 text-base font-bold hover:bg-zinc-200 transition-all"
        >
           {t('finalCta.button')}
        </Link>
      </section>

      <AliigoSupportWidget />
    </div>
  );
}