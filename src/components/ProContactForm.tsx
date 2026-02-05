"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  message: string;
  honeypot: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const DEFAULT_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  message: "",
  honeypot: "",
};

function getUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const read = (key: string) => params.get(key) || undefined;

  return {
    utm_source: read("utm_source"),
    utm_medium: read("utm_medium"),
    utm_campaign: read("utm_campaign"),
    utm_content: read("utm_content"),
    utm_term: read("utm_term"),
  };
}

export function ProContactForm() {
  const t = useTranslations("PricingPage");
  const locale = useLocale() as "en" | "es";
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);

  const isSubmitting = status === "submitting";
  const success = status === "success";

  const helperText = useMemo(() => {
    if (status === "error") return t("form.error");
    if (status === "success") return t("form.success");
    return t("form.helper");
  }, [status, t]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setStatus("submitting");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        website: form.website.trim(),
        message: form.message.trim(),
        honeypot: form.honeypot.trim(),
        locale,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        source: "pricing",
        ...getUtmParams(),
      };

      const res = await fetch("/api/pro-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Request failed");
      setForm(DEFAULT_STATE);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-6 md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          {t("form.name")}
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
            placeholder={t("form.namePlaceholder")}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          {t("form.email")}
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
            placeholder={t("form.emailPlaceholder")}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          {t("form.company")}
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
            placeholder={t("form.companyPlaceholder")}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-zinc-300">
          {t("form.phone")}
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
            placeholder={t("form.phonePlaceholder")}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-zinc-300">
        {t("form.website")}
        <input
          type="url"
          value={form.website}
          onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
          placeholder={t("form.websitePlaceholder")}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-zinc-300">
        {t("form.message")}
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="rounded-lg border border-white/10 bg-zinc-950/70 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#84c9ad] focus:outline-none"
          placeholder={t("form.messagePlaceholder")}
        />
      </label>

      <label className="sr-only" aria-hidden="true">
        {t("form.honeypot")}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(e) => setForm((p) => ({ ...p, honeypot: e.target.value }))}
          className="hidden"
        />
      </label>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className={`text-xs ${success ? "text-[#84c9ad]" : "text-zinc-500"}`}>
          {helperText}
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#84c9ad] px-6 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-[#73bba0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("form.submitting") : t("form.submit")}
        </button>
      </div>
    </form>
  );
}
