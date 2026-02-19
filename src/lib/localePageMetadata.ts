import type { Metadata } from "next";

export function buildLocalePageMetadata(params: {
  locale: string;
  title: string;
  description: string;
  enPath: string;
  esPath: string;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com").replace(/\/$/, "");
  const { locale, title, description, enPath, esPath } = params;
  const canonicalPath = locale === "es" ? esPath : enPath;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: enPath,
        es: esPath,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
    },
  };

  return metadata;
}

