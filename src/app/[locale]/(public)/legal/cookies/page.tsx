import { useTranslations } from "next-intl";

export default function CookiesPage() {
  const t = useTranslations('Legal.cookies');

  return (
    <div className="bg-zinc-950 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-12">
        <div className="border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-zinc-500 text-sm">{t('lastUpdated', { date: new Date().toLocaleDateString() })}</p>
          <p className="mt-4 text-lg">{t('intro')}</p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section1.title')}</h2>
          <p>{t('section1.content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section2.title')}</h2>
          <div className="space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
               <h3 className="text-white font-medium mb-2">{t('section2.technical')}</h3>
               <p className="text-sm text-zinc-400">{t('section2.technicalDesc')}</p>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
               <h3 className="text-white font-medium mb-2">{t('section2.analytical')}</h3>
               <p className="text-sm text-zinc-400">{t('section2.analyticalDesc')}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section3.title')}</h2>
          <p>{t('section3.content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section4.title')}</h2>
          <p>{t('section4.content')}</p>
        </section>
      </div>
    </div>
  );
}