import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

// ✅ Correct path to globals
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
  // ✅ Next.js 15: Await params
  const { locale } = await params;

  // ✅ Security: Ensure locale is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // ✅ Load translations for the Client Provider
  const messages = await getMessages();

  // ⚠️ Ensure you have this in your .env.local file
  // NEXT_PUBLIC_META_PIXEL_ID="123456789"
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* -------------------------------------------------------- */}
        {/* META PIXEL BASE CODE                                */}
        {/* -------------------------------------------------------- */}
        {PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
                alt="meta-pixel"
              />
            </noscript>
          </>
        )}
        {/* -------------------------------------------------------- */}
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}