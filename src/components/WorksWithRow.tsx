import { useTranslations } from "next-intl";

type WorksWithRowProps = {
  className?: string;
};

export function WorksWithRow({ className }: WorksWithRowProps) {
  const t = useTranslations("Landing");
  const logos = [
    { key: "WordPress", file: "/brands/wordpress.svg" },
    { key: "Webflow", file: "/brands/webflow.svg" },
    { key: "Shopify", file: "/brands/shopify.svg" },
    { key: "Wix", file: "/brands/wix.svg" },
    { key: "Squarespace", file: "/brands/squarespace.svg" },
    { key: "Custom sites", file: "/brands/custom.svg" },
  ];

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 text-center">
        {t("demo.worksWith.label")}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {logos.map((logo) => (
          <span
            key={logo.key}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-zinc-300 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <img
              src={logo.file}
              alt={`${logo.key} logo`}
              className="h-6 w-6 md:h-7 md:w-7 object-contain opacity-60 grayscale"
              loading="lazy"
            />
            <span className="font-medium">{logo.key}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-zinc-500 text-center">
        {t("demo.worksWith.note")}
      </div>
    </div>
  );
}
