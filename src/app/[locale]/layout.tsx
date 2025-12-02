import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { GoogleTagManager } from '@next/third-parties/google'; // ✅ Import GTM

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aliigo",
  description: "Reputación y Automatización Local",
};

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
  
  // ✅ Get GTM ID from environment
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* No manual scripts here anymore! */}
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground`}>
        
        {/* ✅ GTM loads here automatically */}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}