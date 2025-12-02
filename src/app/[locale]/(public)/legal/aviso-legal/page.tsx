import { useTranslations } from "next-intl";

const LEGAL_DATA = {
  owner: "Emilio Castellanos", 
  brand: "Aliigo", 
  nif: "55448913F", 
  address: "Atzucat Porta Coeli #18", 
  email: "info@aliigo.com" 
};

export default function PrivacyPage() {
  const t = useTranslations('Legal.privacidad');

  return (
    <div className="bg-zinc-950 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-12">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-zinc-500 text-sm">{t('lastUpdated', { date: new Date().toLocaleDateString() })}</p>
          <p className="mt-4 text-lg">{t('intro')}</p>
        </div>

        {/* 1. Responsable */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section1.title')}</h2>
          <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 space-y-2 text-sm">
             <p><span className="font-semibold text-white">{t('section1.label')}</span> {LEGAL_DATA.owner}</p>
             <p><span className="font-semibold text-white">{t('section1.address')}</span> {LEGAL_DATA.address}</p>
             <p><span className="font-semibold text-white">{t('section1.email')}</span> {LEGAL_DATA.email}</p>
          </div>
        </section>

        {/* 2. Finalidad */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section2.title')}</h2>
          <p className="mb-4">{t('section2.content')}</p>
          <ul className="list-disc pl-5 space-y-2 mb-4 text-zinc-400">
            <li>{t('section2.point1')}</li>
            <li>{t('section2.point2')}</li>
            <li>{t('section2.point3')}</li>
          </ul>
          <p className="text-sm italic text-zinc-500">{t('section2.dataRetention')}</p>
        </section>

        {/* 3. Legitimación */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section3.title')}</h2>
          <p>{t('section3.content')}</p>
        </section>

        {/* 4. Destinatarios */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section4.title')}</h2>
          <p>{t('section4.content')}</p>
        </section>

        {/* 5. Derechos */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">{t('section5.title')}</h2>
          <p>{t('section5.content')}</p>
        </section>
      </div>
    </div>
  );
}