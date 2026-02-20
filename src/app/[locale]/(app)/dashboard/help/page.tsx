// src/app/[locale]/(app)/dashboard/help/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-4 text-xs text-zinc-500">
      {label}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 text-sm text-zinc-300">{children}</div>
    </section>
  );
}

export default function DashboardHelpPage() {
  const t = useTranslations("Dashboard.help");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="text-sm font-medium text-zinc-200">{t("quickLinks.title")}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/50" href="/dashboard/widget">
              {t("quickLinks.widget")}
            </Link>
            <Link className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/50" href="/dashboard/settings/assistant">
              {t("quickLinks.assistant")}
            </Link>
            <Link className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/50" href="/dashboard/messages">
              {t("quickLinks.messages")}
            </Link>
            <Link className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/50" href="/dashboard/billing">
              {t("quickLinks.billing")}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-sm font-semibold text-emerald-200">{t("tip.title")}</div>
          <p className="mt-2 text-sm text-emerald-100/90">{t("tip.body")}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Section title={t("gettingStarted.title")}>
          <p className="text-zinc-400">{t("gettingStarted.desc")}</p>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-zinc-200">
            <li>{t("gettingStarted.steps.0")}</li>
            <li>{t("gettingStarted.steps.1")}</li>
            <li>{t("gettingStarted.steps.2")}</li>
            <li>{t("gettingStarted.steps.3")}</li>
          </ol>
          <ScreenshotPlaceholder label={t("gettingStarted.screenshot")} />
        </Section>

        <Section title={t("installWidget.title")}>
          <p className="text-zinc-400">{t("installWidget.desc")}</p>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-zinc-200">
            <li>{t("installWidget.steps.0")}</li>
            <li>{t("installWidget.steps.1")}</li>
            <li>{t("installWidget.steps.2")}</li>
            <li>{t("installWidget.steps.3")}</li>
          </ol>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase">{t("installWidget.snippetTitle")}</div>
            <pre className="mt-2 text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap">{`<script async src="https://aliigo.com/widget/v1/aliigo-widget.js"></script>\n<aliigo-widget embed-key="YOUR_EMBED_KEY"></aliigo-widget>`}</pre>
          </div>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase">{t("installWidget.troubleshootingTitle")}</div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-zinc-300">
              <li>{t("installWidget.troubleshooting.0")}</li>
              <li>{t("installWidget.troubleshooting.1")}</li>
              <li>{t("installWidget.troubleshooting.2")}</li>
            </ul>
          </div>
          <ScreenshotPlaceholder label={t("installWidget.screenshot")} />
        </Section>

        <Section title={t("customize.title")}>
          <p className="text-zinc-400">{t("customize.desc")}</p>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-200">
            <li>{t("customize.bullets.0")}</li>
            <li>{t("customize.bullets.1")}</li>
            <li>{t("customize.bullets.2")}</li>
            <li>{t("customize.bullets.3")}</li>
          </ul>
          <ScreenshotPlaceholder label={t("customize.screenshot")} />
        </Section>

        <Section title={t("knowledge.title")}>
          <p className="text-zinc-400">{t("knowledge.desc")}</p>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-zinc-200">
            <li>{t("knowledge.steps.0")}</li>
            <li>{t("knowledge.steps.1")}</li>
            <li>{t("knowledge.steps.2")}</li>
            <li>{t("knowledge.steps.3")}</li>
            <li>{t("knowledge.steps.4")}</li>
            <li>{t("knowledge.steps.5")}</li>
          </ol>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase">{t("knowledge.bestPracticesTitle")}</div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-zinc-300">
              <li>{t("knowledge.bestPractices.0")}</li>
              <li>{t("knowledge.bestPractices.1")}</li>
              <li>{t("knowledge.bestPractices.2")}</li>
              <li>{t("knowledge.bestPractices.3")}</li>
            </ul>
          </div>
          <ScreenshotPlaceholder label={t("knowledge.screenshot")} />
        </Section>

        <Section title={t("billing.title")}>
          <p className="text-zinc-400">{t("billing.desc")}</p>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-200">
            <li>{t("billing.bullets.0")}</li>
            <li>{t("billing.bullets.1")}</li>
            <li>{t("billing.bullets.2")}</li>
            <li>{t("billing.bullets.3")}</li>
          </ul>
          <ScreenshotPlaceholder label={t("billing.screenshot")} />
        </Section>
      </div>
    </div>
  );
}
