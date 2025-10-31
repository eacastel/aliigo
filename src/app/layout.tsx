// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google"; // or @next/font/local

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
