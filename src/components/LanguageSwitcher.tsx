"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = (locale === "es" ? "en" : "es") as "en" | "es";

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      disabled={isPending}
      aria-label={locale === "es" ? "Switch language to English" : "Cambiar idioma a Español"}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
        border border-zinc-800
        ${isPending ? "opacity-50" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"}
      `}
    >
      <span className={locale === "es" ? "text-white" : "text-zinc-600 grayscale"}>ES</span>
      <span className="text-zinc-700">/</span>
      <span className={locale === "en" ? "text-white" : "text-zinc-600 grayscale"}>EN</span>
    </button>
  );
}
