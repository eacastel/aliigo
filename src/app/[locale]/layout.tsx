// src/app/[locale]/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { GoogleTagManager } from '@next/third-parties/google'; 
import { cookies } from "next/headers";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Metadata" });

  const title = t("title");
  const description = t("description");

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com").replace(/\/$/, "");

  return {
    title: { default: title, template: t("titleTemplate") },
    description,
    metadataBase: new URL(siteUrl),

    icons: {
      icon: [{ url: "/logo.png", type: "image/png" }], 
    },

    openGraph: {
      type: "website",
      siteName: "Aliigo",
      title,
      description,
      url: siteUrl,
      locale: locale === "es" ? "es_ES" : "en_US",
      images: [
        {
          url: "/logo.png", 
          width: 608,
          height: 260,
          alt: "Aliigo",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"], 
    },

    alternates: {
      languages: {
        en: "/en",
        es: "/es",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Security: Ensure locale is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();
  
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  const cookieStore = await cookies();
  const taggingSetting = cookieStore.get("aliigo_tagging")?.value;
  const allowTagging = taggingSetting !== "off";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com").replace(/\/$/, "");
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aliigo",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Website AI assistant for businesses to answer questions, capture leads, and guide visitors.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "legal@aliigo.com",
        contactType: "legal",
      },
    ],
  };
  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aliigo",
    url: siteUrl,
    inLanguage: locale,
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground`}>
        
        {GTM_ID && allowTagging && <GoogleTagManager gtmId={GTM_ID} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
        
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
