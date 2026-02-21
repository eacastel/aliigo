"use client";

type EntitlementPillProps = {
  label: string;
  href?: string;
  className?: string;
};

export default function EntitlementPill({
  label,
  href,
  className = "",
}: EntitlementPillProps) {
  const color = "lab(55% -12.85 3.72)";
  const borderColor = "lab(55% -12.85 3.72 / 0.55)";
  const pillClass =
    "inline-flex items-center rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

  if (href) {
    return (
      <a
        href={href}
        className={`${pillClass} ${className}`}
        style={{ color, borderColor }}
        aria-label={label}
        title={label}
      >
        {label}
      </a>
    );
  }

  return (
    <span className={`${pillClass} ${className}`} style={{ color, borderColor }}>
      {label}
    </span>
  );
}
