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
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500/80 text-center">
        {t("demo.worksWith.label")}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-6">
        {logos.map((logo) => (
          <span
            key={logo.key}
            className="inline-flex items-center gap-3 px-2 py-1 text-sm text-zinc-400/90"
          >
            <img
              src={logo.file}
              alt={`${logo.key} logo`}
              className="h-7 w-7 md:h-9 md:w-9 object-contain opacity-45 grayscale"
              loading="lazy"
            />
            <span className="font-medium">{logo.key}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-zinc-500/80 text-center">
        {t("demo.worksWith.note")}
      </div>
    </div>
  );
}
