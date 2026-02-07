// src/app/[locale]/(app)/dashboard/settings/assistant/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type AssistantState = {
  system_prompt: string;
  qualification_prompt: string;
  knowledge: string;
};

type PresetTone = "friendly" | "professional" | "concise";
type PresetGoal = "support" | "leads" | "bookings" | "mixed";
type PresetHandoff = "rare" | "balanced" | "proactive";
type PresetCta = "soft" | "direct";

type AssistantForm = {
  tone: PresetTone;
  goal: PresetGoal;
  handoff: PresetHandoff;
  cta: PresetCta;
  supportEmail: string;
  intro: string;
  scope: string;
  styleRules: string;
  additionalInstructions: string;
  businessSummary: string;
  businessDetails: string;
  keyFacts: string;
  policies: string;
  links: string;
  ctaUrls: string;
  additionalBusinessInfo: string;
  qualificationPrompt: string;
};

type JoinedBusiness = {
  id?: string | null;
  system_prompt?: string | null;
  qualification_prompt?: string | null;
  knowledge?: string | null;
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

const SECTION_HEADER = (title: string) => `## ${title}`;

function extractSection(raw: string, title: string): string | null {
  const re = new RegExp(
    `^##\\s+${title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)`,
    "m"
  );
  const m = raw.match(re);
  return m ? m[1].trim() : null;
}

function hasStructuredSections(raw: string) {
  return raw.includes(SECTION_HEADER("Presets")) || raw.includes(SECTION_HEADER("Business Summary"));
}

function parseSystemPrompt(raw: string) {
  const presets = extractSection(raw, "Presets") || "";
  const intro = extractSection(raw, "Introduction") || "";
  const scope = extractSection(raw, "Scope & Boundaries") || "";
  const styleRules = extractSection(raw, "Style Rules") || "";
  const additional = extractSection(raw, "Additional Instructions") || "";

  const toneMatch = presets.match(/Tone:\s*(.+)/i)?.[1]?.trim().toLowerCase();
  const goalMatch = presets.match(/Primary goal:\s*(.+)/i)?.[1]?.trim().toLowerCase();
  const handoffMatch = presets.match(/Handoff:\s*(.+)/i)?.[1]?.trim().toLowerCase();
  const ctaMatch = presets.match(/CTA style:\s*(.+)/i)?.[1]?.trim().toLowerCase();

  return {
    tone: (toneMatch as PresetTone) || "friendly",
    goal: (goalMatch as PresetGoal) || "mixed",
    handoff: (handoffMatch as PresetHandoff) || "balanced",
    cta: (ctaMatch as PresetCta) || "soft",
    intro,
    scope,
    styleRules,
    additionalInstructions: additional || (hasStructuredSections(raw) ? "" : raw.trim()),
  };
}

function parseKnowledge(raw: string) {
  const businessSummary = extractSection(raw, "Business Summary") || "";
  const businessDetails = extractSection(raw, "What You Do") || "";
  const keyFacts = extractSection(raw, "Key Facts") || "";
  const policies = extractSection(raw, "Policies") || "";
  const links = extractSection(raw, "Links") || "";
  const supportEmail = extractSection(raw, "Support Email") || "";
  const additional = extractSection(raw, "Additional Business Info") || "";

  return {
    businessSummary,
    businessDetails,
    keyFacts,
    policies,
    links,
    supportEmail,
    additionalBusinessInfo: additional || (hasStructuredSections(raw) ? "" : raw.trim()),
  };
}

function composeSystemPrompt(form: AssistantForm) {
  return [
    SECTION_HEADER("Presets"),
    `Tone: ${form.tone}`,
    `Primary goal: ${form.goal}`,
    `Handoff: ${form.handoff}`,
    `CTA style: ${form.cta}`,
    "",
    SECTION_HEADER("Language"),
    "Always respond in the same language as the user's most recent message.",
    "If the user switches languages, follow them.",
    "If you are unsure, ask a brief clarifying question.",
    "",
    SECTION_HEADER("Introduction"),
    form.intro || "Optional. If empty, introduce yourself naturally only once when the conversation starts.",
    "",
    SECTION_HEADER("Scope & Boundaries"),
    form.scope || "Optional. Define what the assistant should and should not answer.",
    "",
    SECTION_HEADER("Style Rules"),
    form.styleRules || "Optional. Add tone or response-format rules.",
    "",
    SECTION_HEADER("Additional Instructions"),
    form.additionalInstructions || "",
  ]
    .join("\n")
    .trim();
}

function composeKnowledge(form: AssistantForm) {
  return [
    SECTION_HEADER("Business Summary"),
    form.businessSummary || "",
    "",
    SECTION_HEADER("What You Do"),
    form.businessDetails || "",
    "",
    SECTION_HEADER("Key Facts"),
    form.keyFacts || "",
    "",
    SECTION_HEADER("Policies"),
    form.policies || "",
    "",
    SECTION_HEADER("Links"),
    form.links || "",
    "",
    SECTION_HEADER("CTA URLs"),
    form.ctaUrls || "",
    "",
    SECTION_HEADER("Support Email"),
    form.supportEmail || "",
    "",
    SECTION_HEADER("Additional Business Info"),
    form.additionalBusinessInfo || "",
  ]
    .join("\n")
    .trim();
}

export default function SettingsAssistantPage() {
  const router = useRouter();
  const t = useTranslations("AssistantSettings");

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [assistant, setAssistant] = useState<AssistantState>({
    system_prompt: "",
    qualification_prompt: "",
    knowledge: "",
  });

  const [form, setForm] = useState<AssistantForm>({
    tone: "friendly",
    goal: "mixed",
      handoff: "balanced",
      cta: "soft",
      supportEmail: "",
      intro: "",
      scope: "",
      styleRules: "",
      additionalInstructions: "",
      businessSummary: "",
    businessDetails: "",
    keyFacts: "",
    policies: "",
      links: "",
      ctaUrls: "",
      additionalBusinessInfo: "",
    qualificationPrompt: "",
  });

  const initialAssistant = useRef<AssistantState | null>(null);
  const lastSavedForm = useRef<AssistantForm | null>(null);
  const presetSaveTimer = useRef<number | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- UI parity buttons ---
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-60 disabled:!cursor-not-allowed";

  const btnBrand =
    `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;

  const btnNeutral =
    `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;


  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;

      if (!uid) {
        setUnauth(true);
        return;
      }

      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            system_prompt,
            qualification_prompt,
            knowledge
          )
        `
        )
        .eq("id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[settings-assistant] join error:", error.message);
        setMsg("Could not load your assistant settings.");
        return;
      }

      if (!isProfileJoinRow(data)) {
        setMsg("Profile not found. Please log in again.");
        return;
      }

      const biz = data.businesses;
      if (data.business_id && biz) {
        setBusinessId(data.business_id);

        const next: AssistantState = {
          system_prompt: (biz.system_prompt ?? "").trim(),
          qualification_prompt: (biz.qualification_prompt ?? "").trim(),
          knowledge: (biz.knowledge ?? "").trim(),
        };

        const parsedSystem = parseSystemPrompt(next.system_prompt);
        const parsedKnowledge = parseKnowledge(next.knowledge);

        setAssistant(next);
        setForm((f) => ({
          ...f,
          tone: parsedSystem.tone,
          goal: parsedSystem.goal,
          handoff: parsedSystem.handoff,
          cta: parsedSystem.cta,
          intro: parsedSystem.intro,
          scope: parsedSystem.scope,
          styleRules: parsedSystem.styleRules,
          additionalInstructions: parsedSystem.additionalInstructions,
          businessSummary: parsedKnowledge.businessSummary,
          businessDetails: parsedKnowledge.businessDetails,
          keyFacts: parsedKnowledge.keyFacts,
          policies: parsedKnowledge.policies,
          links: parsedKnowledge.links,
          ctaUrls: "",
          supportEmail: parsedKnowledge.supportEmail,
          additionalBusinessInfo: parsedKnowledge.additionalBusinessInfo,
          qualificationPrompt: next.qualification_prompt,
        }));

        initialAssistant.current = next;
        lastSavedForm.current = {
          tone: parsedSystem.tone,
          goal: parsedSystem.goal,
          handoff: parsedSystem.handoff,
          cta: parsedSystem.cta,
          intro: parsedSystem.intro,
          scope: parsedSystem.scope,
          styleRules: parsedSystem.styleRules,
          additionalInstructions: parsedSystem.additionalInstructions,
          businessSummary: parsedKnowledge.businessSummary,
          businessDetails: parsedKnowledge.businessDetails,
          keyFacts: parsedKnowledge.keyFacts,
          policies: parsedKnowledge.policies,
          links: parsedKnowledge.links,
          ctaUrls: "",
          supportEmail: parsedKnowledge.supportEmail,
          additionalBusinessInfo: parsedKnowledge.additionalBusinessInfo,
          qualificationPrompt: next.qualification_prompt,
        };
      } else {
        setBusinessId(null);
        const empty = { system_prompt: "", qualification_prompt: "", knowledge: "" };
        setAssistant(empty);
        setForm({
          tone: "friendly",
          goal: "mixed",
          handoff: "balanced",
          cta: "soft",
          supportEmail: "",
          intro: "",
          scope: "",
          styleRules: "",
          additionalInstructions: "",
          businessSummary: "",
          businessDetails: "",
          keyFacts: "",
          policies: "",
          links: "",
          ctaUrls: "",
          additionalBusinessInfo: "",
          qualificationPrompt: "",
        });
        initialAssistant.current = empty;
        lastSavedForm.current = null;
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const dirty = useMemo(() => {
    const ia = initialAssistant.current;
    if (!ia) return false;
    const composedSystem = composeSystemPrompt(form).trim();
    const composedKnowledge = composeKnowledge(form).trim();
    const composedQualification = form.qualificationPrompt.trim();

    return (
      composedSystem !== ia.system_prompt.trim() ||
      composedQualification !== ia.qualification_prompt.trim() ||
      composedKnowledge !== ia.knowledge.trim()
    );
  }, [assistant, form]);

  const previewText = useMemo(() => {
    const business = form.businessSummary.trim() || t("preview.businessFallback");
    return t("preview.response", {
      tone: t(`preview.tone.${form.tone}`),
      goal: t(`preview.goal.${form.goal}`),
      handoff: t(`preview.handoff.${form.handoff}`),
      cta: t(`preview.cta.${form.cta}`),
      business,
    });
  }, [form, t]);

  const autosavePresets = async () => {
    const saved = lastSavedForm.current;
    if (!saved) return;
    if (!initialAssistant.current) return;
    if (saving) return;

    const nextForm: AssistantForm = {
      ...saved,
      tone: form.tone,
      goal: form.goal,
      handoff: form.handoff,
      cta: form.cta,
    };

    const composedSystem = composeSystemPrompt(nextForm);
    const composedKnowledge = composeKnowledge(nextForm);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          business: {
            system_prompt: composedSystem,
            qualification_prompt: nextForm.qualificationPrompt,
            knowledge: composedKnowledge,
          },
        }),
      });

      if (!res.ok) return;

      const j: { business?: { system_prompt?: string | null; qualification_prompt?: string | null; knowledge?: string | null } } =
        await res.json().catch(() => ({}));

      const next: AssistantState = {
        system_prompt: (j.business?.system_prompt ?? composedSystem).trim(),
        qualification_prompt: (j.business?.qualification_prompt ?? nextForm.qualificationPrompt).trim(),
        knowledge: (j.business?.knowledge ?? composedKnowledge).trim(),
      };

      initialAssistant.current = next;
      setAssistant(next);
      lastSavedForm.current = nextForm;
      setMsg(null);
    } catch (e) {
      console.error("[settings-assistant] autosave presets failed", e);
    }
  };

  useEffect(() => {
    if (!lastSavedForm.current) return;
    if (presetSaveTimer.current) {
      window.clearTimeout(presetSaveTimer.current);
    }
    presetSaveTimer.current = window.setTimeout(() => {
      void autosavePresets();
    }, 600);

    return () => {
      if (presetSaveTimer.current) {
        window.clearTimeout(presetSaveTimer.current);
      }
    };
  }, [form.tone, form.goal, form.handoff, form.cta]);

  // valid even if empty; let them clear fields
  const save = async () => {
    setMsg(null);
    if (!dirty) return;

    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      if (!token) {
        setMsg("You must be logged in.");
        setUnauth(true);
        return;
      }

      // IMPORTANT: only send assistant fields; do not touch domains/locale/etc
      const composedSystem = composeSystemPrompt(form);
      const composedKnowledge = composeKnowledge(form);

      const payload = {
        business: {
          system_prompt: composedSystem,
          qualification_prompt: form.qualificationPrompt,
          knowledge: composedKnowledge,
        },
      };

      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const j: {
        error?: string;
        business?: { system_prompt?: string | null; 
        qualification_prompt?: string | null;
        knowledge?: string | null };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(`Save error: ${j.error || "unknown"}`);
        return;
      }

      const next: AssistantState = {
        system_prompt: (j.business?.system_prompt ?? composeSystemPrompt(form)).trim(),
        qualification_prompt: (j.business?.qualification_prompt ?? form.qualificationPrompt).trim(),
        knowledge: (j.business?.knowledge ?? composeKnowledge(form)).trim(),
      };

      initialAssistant.current = next;
      setAssistant(next);
      lastSavedForm.current = form;
      setMsg("Saved.");
    } catch (e: unknown) {
      console.error(e);
      setMsg("Could not save now. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-zinc-400">{t("loading")}</p>;

  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("loginRequired.title")}</h1>
        <p className="text-sm text-zinc-400 mb-4">
          {t("loginRequired.body")}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-black rounded px-4 py-2"
        >
          {t("loginRequired.cta")}
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("noBusiness.title")}</h1>
        <p className="text-sm text-zinc-400">
          {t("noBusiness.body")}
        </p>
        <button
          onClick={() => void load()}
          className="mt-3 border border-zinc-700 text-white rounded px-4 py-2 hover:bg-zinc-900"
        >
          {t("noBusiness.cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl text-white">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {t("description")}
      </p>
      <p className="mb-6 text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{t("guardrails.title")}</span>{" "}
        {t("guardrails.inline")}
      </p>

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg.startsWith("Saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </div>
      )}

      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-sm font-semibold text-zinc-100">{t("sections.presets.title")}</div>
          <p className="text-xs text-zinc-400 mb-4">{t("sections.presets.desc")}</p>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">{t("tone.label")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(["friendly", "professional", "concise"] as PresetTone[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tone: opt }))}
                        className={`${opt === form.tone ? btnBrand : btnNeutral}`}
                      >
                        {t(`tone.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">{t("goal.label")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(["support", "leads", "bookings", "mixed"] as PresetGoal[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, goal: opt }))}
                        className={`${opt === form.goal ? btnBrand : btnNeutral}`}
                      >
                        {t(`goal.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">{t("handoff.label")}</label>
                  <p className="text-[11px] text-zinc-500 mb-2">{t("handoff.help")}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["balanced", "proactive"] as PresetHandoff[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, handoff: opt }))}
                        className={`${opt === form.handoff ? btnBrand : btnNeutral}`}
                      >
                        {t(`handoff.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">{t("cta.label")}</label>
                  <p className="text-[11px] text-zinc-500 mb-2">{t("cta.help")}</p>
                  <div className="flex flex-wrap gap-2">
                    {(["soft", "direct"] as PresetCta[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cta: opt }))}
                        className={`${opt === form.cta ? btnBrand : btnNeutral}`}
                      >
                        {t(`cta.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("supportEmail.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("supportEmail.help")}</p>
                <input
                  className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("supportEmail.placeholder")}
                  value={form.supportEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supportEmail: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("ctaUrls.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("ctaUrls.help")}</p>
                <textarea
                  className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("ctaUrls.placeholder")}
                  value={form.ctaUrls}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ctaUrls: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 h-fit">
              <div className="text-sm font-semibold text-zinc-100 mb-2">{t("preview.title")}</div>
              <div className="text-xs text-zinc-400 mb-3">{t("preview.subtitle")}</div>
              <div className="grid gap-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                  <div className="text-[11px] text-zinc-500 mb-1">{t("preview.userLabel")}</div>
                  {t("preview.userMessage")}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">
                  <div className="text-[11px] text-zinc-500 mb-1">{t("preview.assistantLabel")}</div>
                  {previewText}
                </div>
              </div>
            </div>
          </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">{t("sections.business.title")}</div>
          <p className="text-xs text-zinc-400">{t("sections.business.desc")}</p>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("businessSummary.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("businessSummary.help")}</p>
                <textarea
                  className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("businessSummary.placeholder")}
                  value={form.businessSummary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessSummary: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("businessDetails.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("businessDetails.help")}</p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("businessDetails.placeholder")}
                  value={form.businessDetails}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessDetails: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("keyFacts.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("keyFacts.help")}</p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("keyFacts.placeholder")}
                  value={form.keyFacts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keyFacts: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("policies.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("policies.help")}</p>
                <textarea
                  className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("policies.placeholder")}
                  value={form.policies}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, policies: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("links.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("links.help")}</p>
                <textarea
                  className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("links.placeholder")}
                  value={form.links}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, links: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("additionalBusinessInfo.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("additionalBusinessInfo.help")}</p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("additionalBusinessInfo.placeholder")}
                  value={form.additionalBusinessInfo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, additionalBusinessInfo: e.target.value }))
                  }
                />
              </div>
            </div>

        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">{t("sections.behavior.title")}</div>
          <p className="text-xs text-zinc-400">{t("sections.behavior.desc")}</p>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("intro.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("intro.help")}</p>
                <textarea
                  className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("intro.placeholder")}
                  value={form.intro}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, intro: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("scope.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("scope.help")}</p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("scope.placeholder")}
                  value={form.scope}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scope: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("style.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("style.help")}</p>
                <textarea
                  className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("style.placeholder")}
                  value={form.styleRules}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, styleRules: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("additionalInstructions.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("additionalInstructions.help")}</p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  placeholder={t("additionalInstructions.placeholder")}
                  value={form.additionalInstructions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, additionalInstructions: e.target.value }))
                  }
                />
              </div>
            </div>

        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">{t("sections.qualification.title")}</div>
          <p className="text-xs text-zinc-400">{t("sections.qualification.desc")}</p>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("qualification.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">{t("qualification.help")}</p>
            <textarea
              className="w-full min-h-[220px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              placeholder={t("qualification.placeholder")}
              value={form.qualificationPrompt}
              onChange={(e) =>
                setForm((f) => ({ ...f, qualificationPrompt: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={btnBrand}
          >
            {saving ? t("actions.saving") : t("actions.save")}
          </button>

          <button
            onClick={() => void load()}
            className={btnNeutral}
          >
            {t("actions.reset")}
          </button>
        </div>
      </section>

      {dirty ? (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">{t("actions.unsaved")}</div>
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className={btnBrand}
              >
                {saving ? t("actions.saving") : t("actions.save")}
              </button>
              <button
                onClick={() => void load()}
                className={btnNeutral}
              >
                {t("actions.reset")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
