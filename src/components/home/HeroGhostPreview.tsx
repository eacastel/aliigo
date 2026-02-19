"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { pushToGTM } from "@/lib/gtm";
import { openSupportWidgetPill } from "@/lib/openSupportWidget";

export function HeroGhostPreview({
  trackEventName,
}: {
  trackEventName?: string;
}) {
  const t = useTranslations("LandingLP.heroGhost");
  const fullReply = t("assistant");
  const fullSecondReply = t("assistantBook");
  const [typed, setTyped] = useState("");
  const [typedSecond, setTypedSecond] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [showSecondUser, setShowSecondUser] = useState(false);
  const [showSecondAssistant, setShowSecondAssistant] = useState(false);
  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (reduceMotion) {
      setTyped(fullReply);
      setTypedSecond(fullSecondReply);
      setShowSource(true);
      setShowSecondUser(true);
      setShowSecondAssistant(true);
      return;
    }

    setTyped("");
    setTypedSecond("");
    setShowSource(false);
    setShowSecondUser(false);
    setShowSecondAssistant(false);

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(fullReply.slice(0, i));
      if (i >= fullReply.length) {
        window.clearInterval(id);
        window.setTimeout(() => setShowSource(true), 350);
        window.setTimeout(() => setShowSecondUser(true), 900);
        window.setTimeout(() => setShowSecondAssistant(true), 1400);
      }
    }, 18);

    return () => window.clearInterval(id);
  }, [fullReply, fullSecondReply, reduceMotion]);

  useEffect(() => {
    if (!showSecondAssistant) return;
    if (reduceMotion) {
      setTypedSecond(fullSecondReply);
      return;
    }

    setTypedSecond("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedSecond(fullSecondReply.slice(0, i));
      if (i >= fullSecondReply.length) {
        window.clearInterval(id);
      }
    }, 16);

    return () => window.clearInterval(id);
  }, [showSecondAssistant, fullSecondReply, reduceMotion]);

  return (
    <div className="relative rounded-2xl bg-zinc-900/35 p-3 shadow-xl overflow-hidden">
      <div className="h-[480px] w-full flex flex-col rounded-xl border border-white/[0.08] overflow-hidden saturate-90">
        <div className="h-14 bg-zinc-100 px-5 flex items-center border-b border-zinc-300">
          <div className="text-zinc-900 font-semibold text-xl">{t("title")}</div>
        </div>

        <div className="flex-1 bg-zinc-300 p-4 overflow-hidden">
          <div className="space-y-3 text-sm h-full overflow-y-auto pr-1">
            <div className="ml-auto max-w-[80%] rounded-xl bg-[#7fb79f] text-zinc-950 px-3 py-2">
              {t("user")}
            </div>

            <div className="max-w-[88%] rounded-3xl bg-zinc-900 text-zinc-100 px-4 py-3 min-h-[72px]">
              {typed}
            </div>

            {showSource ? (
              <div className="max-w-[88%] rounded-xl border border-zinc-700 bg-zinc-900/90 px-2.5 py-2 text-xs text-zinc-200">
                <div className="inline-flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#84c9ad]" />
                  <span className="font-medium">{t("viewSource")}</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-300">{t("pdfName")}</span>
                </div>
              </div>
            ) : null}

            {showSecondUser ? (
              <div className="ml-auto max-w-[80%] rounded-xl bg-[#7fb79f] text-zinc-950 px-3 py-2">
                {t("userBook")}
              </div>
            ) : null}
            {showSecondAssistant ? (
              <div className="max-w-[88%] rounded-3xl bg-zinc-900 text-zinc-100 px-4 py-3">
                <p>{typedSecond}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#7fb79f] px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-[#6faa92] transition-colors"
                >
                  {t("bookNow")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-zinc-200 px-4 py-3 border-t border-zinc-300">
          <button
            type="button"
            onClick={() => {
              openSupportWidgetPill();
              if (!trackEventName) return;
              pushToGTM(trackEventName, {
                placement: "hero_ghost",
              });
            }}
            className="block w-full rounded-lg bg-[#7fb79f] px-3 py-2.5 text-center text-sm font-bold text-black hover:bg-[#6faa92] transition-colors"
          >
            {t("tryOwnQuestion")}
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/10" />
    </div>
  );
}
