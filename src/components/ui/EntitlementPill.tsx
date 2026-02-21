"use client";

type EntitlementPillProps = {
  label: string;
  tone?: "default" | "trial" | "included";
  className?: string;
};

const toneClassMap: Record<NonNullable<EntitlementPillProps["tone"]>, string> = {
  default:
    "border-emerald-700/45 bg-emerald-950/55 text-emerald-200",
  trial:
    "border-emerald-600/35 bg-emerald-900/35 text-emerald-200",
  included:
    "border-emerald-500/30 bg-emerald-900/25 text-emerald-100",
};

export default function EntitlementPill({
  label,
  tone = "default",
  className = "",
}: EntitlementPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClassMap[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
