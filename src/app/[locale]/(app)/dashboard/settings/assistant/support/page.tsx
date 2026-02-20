"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "@/i18n/routing";

type AssistantContextMode = "sales" | "support" | "catalog";

type AssistantSettings = {
  supportPanel?: {
    enabled?: boolean;
    defaultMode?: AssistantContextMode;
    overrides?: {
      signedIn?: {
        enabled?: boolean;
        mode?: AssistantContextMode;
      };
      uri?: {
        enabled?: boolean;
        mode?: AssistantContextMode;
        patterns?: string[];
      };
      intent?: {
        enabled?: boolean;
        mode?: AssistantContextMode;
        terms?: string[];
        requireConfirmation?: boolean;
      };
    };
    knowledge?: {
      concepts?: string;
      procedures?: string;
      rules?: string;
    };
  };
};

type JoinedBusiness = {
  id?: string | null;
  assistant_settings?: AssistantSettings | null;
} | null;

type ProfileJoinRow = {
  business_id: string | null;
  businesses: JoinedBusiness;
};

function isProfileJoinRow(x: unknown): x is ProfileJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "business_id" in o && "businesses" in o;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybe = (error as { message?: unknown }).message;
    if (typeof maybe === "string" && maybe.trim()) return maybe;
  }
  return "Could not load support panel settings.";
}

type SupportPanelForm = {
  enabled: boolean;
  defaultMode: AssistantContextMode;
  signedInEnabled: boolean;
  signedInMode: AssistantContextMode;
  uriEnabled: boolean;
  uriMode: AssistantContextMode;
  uriPatterns: string;
  intentEnabled: boolean;
  intentMode: AssistantContextMode;
  intentTerms: string;
  intentConfirm: boolean;
  concepts: string;
  procedures: string;
  rules: string;
};

const sanitizeText = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sanitizeForm = (form: SupportPanelForm): SupportPanelForm => ({
  ...form,
  uriPatterns: sanitizeText(form.uriPatterns),
  intentTerms: sanitizeText(form.intentTerms),
  concepts: sanitizeText(form.concepts),
  procedures: sanitizeText(form.procedures),
  rules: sanitizeText(form.rules),
});

const defaultForm: SupportPanelForm = {
  enabled: false,
  defaultMode: "support",
  signedInEnabled: false,
  signedInMode: "support",
  uriEnabled: false,
  uriMode: "support",
  uriPatterns: "",
  intentEnabled: false,
  intentMode: "support",
  intentTerms: "",
  intentConfirm: true,
  concepts: "",
  procedures: "",
  rules: "",
};

export default function SupportPanelSettingsPage() {
  const router = useRouter();
  const t = useTranslations("AssistantSettings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauth, setUnauth] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [assistantSettings, setAssistantSettings] = useState<AssistantSettings | null>(null);
  const [form, setForm] = useState<SupportPanelForm>(defaultForm);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"success" | "error">("success");
  const [knowledgeTab, setKnowledgeTab] = useState<"concepts" | "procedures" | "rules">("concepts");

  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-45 disabled:!cursor-not-allowed disabled:pointer-events-none";
  const btnBrand = `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;
  const btnNeutral = `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;

  const folderTabBase =
    "rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors";
  const folderTabActive = `${folderTabBase} border-zinc-700 bg-zinc-900 text-zinc-100`;
  const folderTabIdle = `${folderTabBase} border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:bg-zinc-900/70`;

  const modeOptions: AssistantContextMode[] = ["support", "sales", "catalog"];

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id;
        if (!uid) {
          setUnauth(true);
          return;
        }

        let { data, error } = await supabase
          .from("business_profiles")
          .select(
            `
              business_id,
              businesses:businesses!business_profiles_business_id_fkey (
                id,
                assistant_settings
              )
            `,
          )
          .eq("id", uid)
          .maybeSingle();

        if (error) {
          const fallback = await supabase
            .from("business_profiles")
            .select(
              `
                business_id,
                businesses:businesses!business_profiles_business_id_fkey (
                  id,
                  assistant_settings
                )
              `,
            )
            .eq("id", uid)
            .limit(1);
          if (fallback.error) {
            setMsgTone("error");
            setMsg(getErrorMessage(fallback.error));
            setBusinessId(null);
            setForm(defaultForm);
            setAssistantSettings(null);
            return;
          }
          data = fallback.data?.[0] ?? null;
          error = null;
        }

        if (!isProfileJoinRow(data) || !data.business_id || !data.businesses) {
          setBusinessId(null);
          setForm(defaultForm);
          setAssistantSettings(null);
          return;
        }

        setBusinessId(data.business_id);
        const settings = (data.businesses.assistant_settings ?? null) as AssistantSettings | null;
        setAssistantSettings(settings);

        const supportPanel = settings?.supportPanel;
        setForm({
          enabled: supportPanel?.enabled ?? false,
          defaultMode: supportPanel?.defaultMode ?? "support",
          signedInEnabled: supportPanel?.overrides?.signedIn?.enabled ?? false,
          signedInMode: supportPanel?.overrides?.signedIn?.mode ?? "support",
          uriEnabled: supportPanel?.overrides?.uri?.enabled ?? false,
          uriMode: supportPanel?.overrides?.uri?.mode ?? "support",
          uriPatterns: (supportPanel?.overrides?.uri?.patterns ?? []).join("\n"),
          intentEnabled: supportPanel?.overrides?.intent?.enabled ?? false,
          intentMode: supportPanel?.overrides?.intent?.mode ?? "support",
          intentTerms: (supportPanel?.overrides?.intent?.terms ?? []).join("\n"),
          intentConfirm: supportPanel?.overrides?.intent?.requireConfirmation ?? true,
          concepts: supportPanel?.knowledge?.concepts ?? "",
          procedures: supportPanel?.knowledge?.procedures ?? "",
          rules: supportPanel?.knowledge?.rules ?? "",
        });
      } catch (e) {
        console.warn("[support-panel-settings] load", e);
        setMsgTone("error");
        setMsg(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [t]);

  const save = async () => {
    if (!businessId) return;
    setMsg(null);
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMsgTone("error");
        setMsg(t("workflow.loginRequired"));
        return;
      }

      const next = sanitizeForm(form);
      const nextSettings: AssistantSettings = {
        ...(assistantSettings ?? {}),
        supportPanel: {
          enabled: next.enabled,
          defaultMode: next.defaultMode,
          overrides: {
            signedIn: {
              enabled: next.signedInEnabled,
              mode: next.signedInMode,
            },
            uri: {
              enabled: next.uriEnabled,
              mode: next.uriMode,
              patterns: next.uriPatterns
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean),
            },
            intent: {
              enabled: next.intentEnabled,
              mode: next.intentMode,
              terms: next.intentTerms
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean),
              requireConfirmation: next.intentConfirm,
            },
          },
          knowledge: {
            concepts: next.concepts,
            procedures: next.procedures,
            rules: next.rules,
          },
        },
      };

      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business: {
            assistant_settings: nextSettings,
          },
        }),
      });

      const j: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsgTone("error");
        setMsg(`${t("workflow.saveDraftError")}: ${j.error || "unknown"}`);
        return;
      }

      setAssistantSettings(nextSettings);
      setForm(next);
      setMsgTone("success");
      setMsg(t("workflow.draftSaved"));
    } catch (e) {
      console.error("[support-panel-settings] save", e);
      setMsgTone("error");
      setMsg(t("workflow.saveDraftError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-4 text-sm text-zinc-400">{t("loading")}</p>;
  }

  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("loginRequired.title")}</h1>
        <p className="text-sm text-zinc-400 mb-4">{t("loginRequired.body")}</p>
        <button onClick={() => router.push("/login")} className="bg-white text-black rounded px-4 py-2">
          {t("loginRequired.cta")}
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("noBusiness.title")}</h1>
        <p className="text-sm text-zinc-400">{t("noBusiness.body")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">{t("tabs.supportPanel")}</h1>
      <p className="mb-6 text-sm text-zinc-400">{t("supportPanel.desc")}</p>

      {msg ? (
        <div className={`mb-4 text-sm ${msgTone === "error" ? "text-red-400" : "text-green-400"}`}>{msg}</div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/dashboard/settings/assistant" className={btnNeutral}>
          {t("tabs.assistant")}
        </Link>
        <Link href={{ pathname: "/dashboard/settings/assistant", query: { tab: "indexed" } }} className={btnNeutral}>
          {t("tabs.indexed")}
        </Link>
        <button type="button" className={btnBrand}>
          {t("tabs.supportPanel")}
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          />
          <span>{t("supportPanel.enabled")}</span>
        </label>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">{t("supportPanel.defaultMode")}</label>
          <select
            className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            value={form.defaultMode}
            onChange={(e) =>
              setForm((f) => ({ ...f, defaultMode: e.target.value as AssistantContextMode }))
            }
          >
            {modeOptions.map((mode) => (
              <option key={mode} value={mode}>
                {t(`supportPanel.modes.${mode}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">{t("supportPanel.overrides.title")}</div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={form.signedInEnabled}
                onChange={(e) => setForm((f) => ({ ...f, signedInEnabled: e.target.checked }))}
              />
              <span>{t("supportPanel.overrides.signedIn")}</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={form.uriEnabled}
                onChange={(e) => setForm((f) => ({ ...f, uriEnabled: e.target.checked }))}
              />
              <span>{t("supportPanel.overrides.uri")}</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={form.intentEnabled}
                onChange={(e) => setForm((f) => ({ ...f, intentEnabled: e.target.checked }))}
              />
              <span>{t("supportPanel.overrides.intent")}</span>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <select
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.signedInMode}
              onChange={(e) =>
                setForm((f) => ({ ...f, signedInMode: e.target.value as AssistantContextMode }))
              }
            >
              {modeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`supportPanel.modes.${mode}`)}
                </option>
              ))}
            </select>
            <select
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.uriMode}
              onChange={(e) =>
                setForm((f) => ({ ...f, uriMode: e.target.value as AssistantContextMode }))
              }
            >
              {modeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`supportPanel.modes.${mode}`)}
                </option>
              ))}
            </select>
            <select
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.intentMode}
              onChange={(e) =>
                setForm((f) => ({ ...f, intentMode: e.target.value as AssistantContextMode }))
              }
            >
              {modeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`supportPanel.modes.${mode}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <textarea
              className="w-full min-h-[96px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.uriPatterns}
              onChange={(e) => setForm((f) => ({ ...f, uriPatterns: e.target.value }))}
              placeholder={t("supportPanel.overrides.uriPlaceholder")}
            />
            <div className="space-y-3">
              <textarea
                className="w-full min-h-[96px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                value={form.intentTerms}
                onChange={(e) => setForm((f) => ({ ...f, intentTerms: e.target.value }))}
                placeholder={t("supportPanel.overrides.intentPlaceholder")}
              />
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.intentConfirm}
                  onChange={(e) => setForm((f) => ({ ...f, intentConfirm: e.target.checked }))}
                />
                <span>{t("supportPanel.overrides.intentConfirm")}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-3 flex items-end gap-2 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setKnowledgeTab("concepts")}
              className={knowledgeTab === "concepts" ? folderTabActive : folderTabIdle}
            >
              {t("supportPanel.knowledge.concepts")}
            </button>
            <button
              type="button"
              onClick={() => setKnowledgeTab("procedures")}
              className={knowledgeTab === "procedures" ? folderTabActive : folderTabIdle}
            >
              {t("supportPanel.knowledge.procedures")}
            </button>
            <button
              type="button"
              onClick={() => setKnowledgeTab("rules")}
              className={knowledgeTab === "rules" ? folderTabActive : folderTabIdle}
            >
              {t("supportPanel.knowledge.rules")}
            </button>
          </div>

          {knowledgeTab === "concepts" ? (
            <textarea
              className="w-full min-h-[180px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.concepts}
              onChange={(e) => setForm((f) => ({ ...f, concepts: e.target.value }))}
            />
          ) : null}
          {knowledgeTab === "procedures" ? (
            <textarea
              className="w-full min-h-[180px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.procedures}
              onChange={(e) => setForm((f) => ({ ...f, procedures: e.target.value }))}
            />
          ) : null}
          {knowledgeTab === "rules" ? (
            <textarea
              className="w-full min-h-[180px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.rules}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
            />
          ) : null}
        </div>
      </section>

      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving} className={btnBrand}>
          {saving ? t("actions.saving") : t("supportPanel.saveAction")}
        </button>
        <Link href="/dashboard/settings/assistant" className={btnNeutral}>
          {t("actions.reset")}
        </Link>
      </div>
    </div>
  );
}
