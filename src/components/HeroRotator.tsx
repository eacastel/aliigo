// src/components/HeroRotator.tsx
"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

export default function HeroRotator() {
  const locale = useLocale();
  const alt =
    locale === "es"
      ? "Asistente web — responde al instante y capta leads 24/7"
      : "Website assistant — instant answers and qualified leads 24/7";

  return (
    <div className="relative w-full aspect-[16/9]">
      <Image
        src="/hero/hero-chat.png"
        alt={alt}
        fill
        className="rounded-xl object-cover"
        priority
      />
    </div>
  );
}
