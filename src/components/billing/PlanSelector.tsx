"use client";

import { useTranslations } from "next-intl";

type Plan = "basic" | "growth" | "pro";

export default function PlanSelector({
  value,
  onChange,
  locale,
  currency,
}: {
  value: Plan;
  onChange: (nextPlan: Plan) => void;
  locale: string;
  currency: "EUR" | "USD";
}) {
  const t = useTranslations("Billing");
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const basic = fmt.format(currency === "USD" ? 49 : 39);
  const growth = fmt.format(currency === "USD" ? 99 : 89);
  const pro = fmt.format(currency === "USD" ? 149 : 129);

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => onChange("basic")}
        aria-pressed={value === "basic"}
        className={`border rounded-xl p-4 text-left ${
          value === "basic" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-3 w-3 rounded-full border ${
              value === "basic"
                ? "border-[#84C9AD] bg-[#84C9AD]"
                : "border-zinc-600 bg-transparent"
            }`}
          />
          <div>
            <div className="font-medium text-zinc-100">Aliigo Basic</div>
            <div className="text-sm text-zinc-400">
              {basic} {t("priceAfterTrial")}
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

      <button
        type="button"
        onClick={() => onChange("pro")}
        aria-pressed={value === "pro"}
        className={`border rounded-xl p-4 text-left ${
          value === "pro" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-1 h-3 w-3 rounded-full border ${
              value === "pro"
                ? "border-[#84C9AD] bg-[#84C9AD]"
                : "border-zinc-600 bg-transparent"
            }`}
          />
          <div>
            <div className="font-medium text-zinc-100">Aliigo Pro</div>
            <div className="text-sm text-zinc-400">
              {pro} {t("priceAfterTrial")}
            </div>
          </div>
        </div>
      </button>

      <div className="text-sm text-zinc-500" />
    </div>
  );
}
