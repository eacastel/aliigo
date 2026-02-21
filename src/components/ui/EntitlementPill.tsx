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
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="inline-flex items-center rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color, borderColor }}
      >
        {label}
      </span>
      {href ? (
        <a
          href={href}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold leading-none"
          style={{ color, borderColor }}
          aria-label="Open plans matrix"
          title="Open plans matrix"
        >
          i
        </a>
      ) : null}
    </span>
  );
}
