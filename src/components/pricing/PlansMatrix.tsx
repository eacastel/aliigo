"use client";

import { useRef } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Link } from "@/i18n/routing";

export type MatrixRow = {
  feature: string;
  basic: string;
  growth: string;
  pro: string;
  custom: string;
  type: "text" | "bool";
};

export function PlansMatrix({
  isEs,
  rows,
}: {
  isEs: boolean;
  rows: MatrixRow[];
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -520 : 520,
      behavior: "smooth",
    });
  };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/40 p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-zinc-500">
        <span>{isEs ? "Desliza para comparar más columnas" : "Swipe to compare more columns"}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="rounded-md border border-white/15 bg-zinc-900/60 p-1.5 text-zinc-300 transition hover:border-white/30 hover:text-white"
            aria-label={isEs ? "Ver columnas anteriores" : "View previous columns"}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="rounded-md border border-white/15 bg-zinc-900/60 p-1.5 text-zinc-300 transition hover:border-white/30 hover:text-white"
            aria-label={isEs ? "Ver más columnas" : "View more columns"}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-auto scroll-smooth [scrollbar-width:thin]"
      >
        <table className="min-w-[1520px] table-fixed text-sm">
          <colgroup>
            <col className="w-[280px]" />
            <col className="w-[310px]" />
            <col className="w-[310px]" />
            <col className="w-[310px]" />
            <col className="w-[310px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 text-zinc-200">
              <th className="sticky left-0 z-20 border-r border-white/10 bg-zinc-900 px-5 py-3 text-left font-semibold">
                {isEs ? "Características" : "Features"}
              </th>
              <th className="border-l border-white/10 px-5 py-3 text-center font-semibold text-emerald-300">Basic</th>
              <th className="border-l border-white/10 px-5 py-3 text-center font-semibold text-emerald-300">Growth</th>
              <th className="border-l border-white/10 px-5 py-3 text-center font-semibold text-emerald-300">Pro</th>
              <th className="border-l border-white/10 px-5 py-3 text-center font-semibold text-emerald-300">Custom</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.feature}
                className={`border-b border-white/5 text-zinc-400 ${
                  rowIndex % 2 === 0 ? "bg-zinc-900/5" : "bg-zinc-800/45"
                }`}
              >
                <td
                  className={`sticky left-0 z-10 border-r border-white/10 px-5 py-5 text-left text-zinc-200 ${
                    rowIndex % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800"
                  }`}
                >
                  {row.feature}
                </td>
                {[row.basic, row.growth, row.pro, row.custom].map((value, idx) => (
                  <td key={`${row.feature}-${idx}`} className="border-l border-white/10 px-5 py-5 text-center">
                    {row.type === "bool" ? (
                      value ? (
                        <span className="inline-flex items-center justify-center gap-1 text-xs text-emerald-300">
                          <Check size={14} /> {isEs ? "Incluido" : "Included"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-xs text-zinc-400">
                          <X size={14} /> {isEs ? "No incluido" : "Not included"}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center justify-center text-sm text-zinc-200">{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-zinc-900/20">
              <td className="sticky left-0 z-10 border-r border-white/10 bg-zinc-900 px-5 py-5 text-left text-zinc-200">
                {isEs ? "Elegir plan" : "Choose plan"}
              </td>
              <td className="border-l border-white/10 px-5 py-5 text-center">
                <Link
                  href={{ pathname: "/signup", query: { plan: "basic" } }}
                  className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  {isEs ? "Elegir Basic" : "Choose Basic"}
                </Link>
              </td>
              <td className="border-l border-white/10 px-5 py-5 text-center">
                <Link
                  href={{ pathname: "/signup", query: { plan: "growth" } }}
                  className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  {isEs ? "Elegir Growth" : "Choose Growth"}
                </Link>
              </td>
              <td className="border-l border-white/10 px-5 py-5 text-center">
                <Link
                  href={{ pathname: "/signup", query: { plan: "pro" } }}
                  className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  {isEs ? "Elegir Pro" : "Choose Pro"}
                </Link>
              </td>
              <td className="border-l border-white/10 px-5 py-5 text-center">
                <Link
                  href={{ pathname: "/pricing", hash: "sales-contact" }}
                  className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  {isEs ? "Hablar con ventas" : "Contact sales"}
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
