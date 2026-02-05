"use client";

type Plan = "starter" | "growth";

export default function PlanSelector({
  value,
  onChange,
}: {
  value: Plan;
  onChange: (p: Plan) => void;
}) {
  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => onChange("starter")}
        className={`border rounded-xl p-4 text-left ${
          value === "starter" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="font-medium text-zinc-100">Aliigo Starter</div>
        <div className="text-sm text-zinc-400">€99 / month after trial</div>
      </button>

      <button
        type="button"
        onClick={() => onChange("growth")}
        className={`border rounded-xl p-4 text-left ${
          value === "growth" ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        <div className="font-medium text-zinc-100">Aliigo Growth</div>
        <div className="text-sm text-zinc-400">€149 / month after trial</div>
      </button>

      <div className="text-sm text-zinc-500">
        Pro is custom. Contact us to set it up.
      </div>
    </div>
  );
}
