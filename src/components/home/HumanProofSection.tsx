"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const proofImages = [
  { key: "relax", src: "/ads/relax2.png" },
  { key: "handshake", src: "/ads/handshake2.png" },
  { key: "vet", src: "/ads/vet2.png" },
  { key: "stats", src: "/ads/stats.png" },
] as const;

export function HumanProofSection() {
  const t = useTranslations("Landing.proof");

  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className="bg-gradient-to-r from-white to-[#84c9ad] bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h2>
          <p className="mt-3 text-sm text-zinc-400 md:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {proofImages.map(({ key, src }) => (
            <article
              key={key}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={src}
                  alt={t(`${key}.title`)}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/30 to-transparent" />
              </div>

              <div className="p-5 md:p-6">
                <h3 className="text-xl font-semibold text-white">{t(`${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {t(`${key}.desc`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
