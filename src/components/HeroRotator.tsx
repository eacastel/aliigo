// src/components/HeroRotator.tsx
"use client";

import Image from "next/image";

export default function HeroRotator() {
  return (
    <div className="relative w-full aspect-[16/9]">
      <Image
        src="/hero/hero-chat.png"
        alt="Asistente web — responde al instante y capta leads 24/7."
        fill
        className="rounded-xl object-cover"
        priority
      />
    </div>
  );
}
