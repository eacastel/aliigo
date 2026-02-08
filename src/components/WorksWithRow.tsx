import { useTranslations } from "next-intl";

type WorksWithRowProps = {
  className?: string;
};

export function WorksWithRow({ className }: WorksWithRowProps) {
  const t = useTranslations("Landing");
  const items = t("demo.worksWith.items");
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
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {t("demo.worksWith.label")}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-300">
        {items.split("·").map((item) => (
          <span
            key={item.trim()}
            className="rounded-full border border-white/10 bg-zinc-900/60 px-3 py-1"
          >
            {item.trim()}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {logos.map((logo) => (
          <span
            key={logo.key}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800/60">
              <img
                src={logo.file}
                alt={`${logo.key} logo`}
                className="h-4 w-4 object-contain"
                loading="lazy"
              />
            </span>
            <span>{logo.key}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        {t("demo.worksWith.note")}
      </div>
    </div>
  );
}
