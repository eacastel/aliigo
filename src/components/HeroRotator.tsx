"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const IMAGES = [
  {
    src: "/hero/hero-reviews.png",
    alt: "Solicitudes de reseñas — consigue reseñas reales en los sitios que importan.",
  },
  {
    src: "/hero/hero-chat.png",
    alt: "Chat unificado — conversa desde web y WhatsApp en un solo buzón.",
  },
  {
    src: "/hero/hero-reputation.png",
    alt: "Resumen de reputación — insights semanales para mejorar el servicio.",
  },
  {
    src: "/hero/hero-directories.png",
    alt: "Directorios y NAP — datos coherentes en Google, Bing, Apple y más.",
  },
];

export default function HeroRotator() {
  const [index, setIndex] = useState(0);

  // Cambiar slide cada 4s
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % IMAGES.length),
      4000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full aspect-[16/9]">
      {IMAGES.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          className={`rounded-xl object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          priority={i === 0}
        />
      ))}
    </div>
  );
}
