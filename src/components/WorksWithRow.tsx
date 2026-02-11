type WorksWithRowProps = {
  className?: string;
};

export function WorksWithRow({ className }: WorksWithRowProps) {
  const logos = [
    { key: "WordPress", file: "/brands/wordpress.svg" },
    { key: "Webflow", file: "/brands/webflow.svg" },
    { key: "Shopify", file: "/brands/shopify.svg" },
    { key: "Drupal", file: "/brands/drupal.svg" },
    { key: "Wix", file: "/brands/wix.svg" },
    { key: "Squarespace", file: "/brands/squarespace.svg" },
    { key: "Custom sites", file: "/brands/custom.svg" },
  ];

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {logos.map((logo) => (
          <span
            key={logo.key}
            className="group inline-flex items-center justify-center px-2 py-1 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <img
              src={logo.file}
              alt={`${logo.key} logo`}
              className="h-8 md:h-10 lg:h-12 w-auto object-contain opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-[1.05] drop-shadow-[0_0_10px_rgba(148,163,184,0.2)]"
              loading="lazy"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
