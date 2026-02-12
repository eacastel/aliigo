"use client";

import { useTranslations } from "next-intl";

type Plan = "starter" | "growth";

export default function PlanSelector({
  value,
  onChange,
  locale,
  currency,
}: {
  value: Plan;
  onChange: (p: Plan) => void;
  locale: string;
  currency: "EUR" | "USD";
}) {
  const t = useTranslations("Billing");
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const starter = fmt.format(99);
  const growth = fmt.format(149);

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => onChange("starter")}
        aria-pressed={value === "starter"}
        className={`border rounded-xl p-4 text-left ${
          value === "starter" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-3 w-3 rounded-full border ${
              value === "starter"
                ? "border-[#84C9AD] bg-[#84C9AD]"
                : "border-zinc-600 bg-transparent"
            }`}
          />
          <div>
            <div className="font-medium text-zinc-100">Aliigo Starter</div>
            <div className="text-sm text-zinc-400">
              {starter} {t("priceAfterTrial")}
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange("growth")}
        aria-pressed={value === "growth"}
        className={`border rounded-xl p-4 text-left ${
          value === "growth" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-3 w-3 rounded-full border ${
              value === "growth"
                ? "border-[#84C9AD] bg-[#84C9AD]"
                : "border-zinc-600 bg-transparent"
            }`}
          />
          <div>
            <div className="font-medium text-zinc-100">Aliigo Growth</div>
            <div className="text-sm text-zinc-400">
              {growth} {t("priceAfterTrial")}
            </div>
          </div>
        </div>
      </button>

      <div className="text-sm text-zinc-500" />
    </div>
  );
}
