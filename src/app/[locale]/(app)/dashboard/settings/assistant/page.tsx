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
  assistant_settings?: AssistantSettings | null;
  allowed_domains?: string[] | null;
  billing_plan?: string | null;
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

type AssistantSettings = {
  system?: {
    tone?: PresetTone;
    goal?: PresetGoal;
    handoff?: PresetHandoff;
    cta?: PresetCta;
    intro?: string;
    scope?: string;
    styleRules?: string;
    additionalInstructions?: string;
  };
  knowledge?: {
    businessSummary?: string;
    businessDetails?: string;
    keyFacts?: string;
    policies?: string;
    links?: string;
    ctaUrls?: string;
    supportEmail?: string;
    additionalBusinessInfo?: string;
  };
};

type AssistantSettingsEnvelope = AssistantSettings & {
  draft?: {
    form?: Partial<AssistantForm>;
    sourceUrl?: string | null;
    fieldStatuses?: Record<string, "suggested" | "needs_review" | "missing">;
    fieldProvenance?: Record<string, "manual" | "suggested">;
    generationMode?: "merge" | "replace";
    generatorVersion?: string;
    advancedRecommendations?: Partial<Record<AdvancedRecField, AdvancedRecommendation>>;
    savedAt?: string;
    savedBy?: string;
  } | null;
  workflow?: {
    lastDraftSavedAt?: string;
    lastDraftSavedBy?: string;
    lastPublishedAt?: string;
    lastPublishedBy?: string;
    lastMissingRequired?: string[];
  };
};

type IndexRun = {
  id: string;
  status: string;
  pages_scanned: number;
  documents_upserted: number;
  chunks_upserted: number;
  started_at: string;
  finished_at: string | null;
  errors: string[] | null;
};

type IndexedDocument = {
  id: string;
  source_url: string | null;
  source_label: string | null;
  locale: string | null;
  status: string | null;
  updated_at: string;
  chunkCount: number;
  preview: string;
  previewUpdatedAt: string | null;
};

type IndexSummary = {
  totals: {
    documents: number;
    chunks: number;
  };
  pagination: {
    page: number;
    limit: number;
  };
  runs: IndexRun[];
  documents: IndexedDocument[];
};

type AdvancedRecField = "scope" | "styleRules" | "additionalInstructions" | "qualificationPrompt";
type AdvancedRecommendation = {
  value: string;
  confidence: "low" | "medium" | "high";
  rationale: string;
  sources: string[];
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "");

const sanitizeMarkdown = (value: string) =>
  stripHtml(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sanitizeForm = (form: AssistantForm): AssistantForm => ({
  ...form,
  supportEmail: sanitizeMarkdown(form.supportEmail),
  intro: sanitizeMarkdown(form.intro),
  scope: sanitizeMarkdown(form.scope),
  styleRules: sanitizeMarkdown(form.styleRules),
  additionalInstructions: sanitizeMarkdown(form.additionalInstructions),
  businessSummary: sanitizeMarkdown(form.businessSummary),
  businessDetails: sanitizeMarkdown(form.businessDetails),
  keyFacts: sanitizeMarkdown(form.keyFacts),
  policies: sanitizeMarkdown(form.policies),
  links: sanitizeMarkdown(form.links),
  ctaUrls: sanitizeMarkdown(form.ctaUrls),
  additionalBusinessInfo: sanitizeMarkdown(form.additionalBusinessInfo),
  qualificationPrompt: sanitizeMarkdown(form.qualificationPrompt),
});

const toAssistantSettings = (form: AssistantForm): AssistantSettings => ({
  system: {
    tone: form.tone,
    goal: form.goal,
    handoff: form.handoff,
    cta: form.cta,
    intro: form.intro,
    scope: form.scope,
    styleRules: form.styleRules,
    additionalInstructions: form.additionalInstructions,
  },
  knowledge: {
    businessSummary: form.businessSummary,
    businessDetails: form.businessDetails,
    keyFacts: form.keyFacts,
    policies: form.policies,
    links: form.links,
    ctaUrls: form.ctaUrls,
    supportEmail: form.supportEmail,
    additionalBusinessInfo: form.additionalBusinessInfo,
  },
});

function extractSection(raw: string, title: string): string | null {
  const re = new RegExp(
    `^##\\s+${title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)`,
    "m",
  );
  const m = raw.match(re);
  return m ? m[1].trim() : null;
}

function hasStructuredSections(raw: string) {
  return (
    raw.includes(SECTION_HEADER("Presets")) ||
    raw.includes(SECTION_HEADER("Business Summary"))
  );
}

function parseSystemPrompt(raw: string) {
  const presets = extractSection(raw, "Presets") || "";
  const intro = extractSection(raw, "Introduction") || "";
  const scope = extractSection(raw, "Scope & Boundaries") || "";
  const styleRules = extractSection(raw, "Style Rules") || "";
  const additional = extractSection(raw, "Additional Instructions") || "";

  const toneMatch = presets
    .match(/Tone:\s*(.+)/i)?.[1]
    ?.trim()
    .toLowerCase();
  const goalMatch = presets
    .match(/Primary goal:\s*(.+)/i)?.[1]
    ?.trim()
    .toLowerCase();
  const handoffMatch = presets
    .match(/Handoff:\s*(.+)/i)?.[1]
    ?.trim()
    .toLowerCase();
  const ctaMatch = presets
    .match(/CTA style:\s*(.+)/i)?.[1]
    ?.trim()
    .toLowerCase();

  return {
    tone: (toneMatch as PresetTone) || "friendly",
    goal: (goalMatch as PresetGoal) || "mixed",
    handoff: (handoffMatch as PresetHandoff) || "balanced",
    cta: (ctaMatch as PresetCta) || "soft",
    intro,
    scope,
    styleRules,
    additionalInstructions:
      additional || (hasStructuredSections(raw) ? "" : raw.trim()),
  };
}

function parseKnowledge(raw: string) {
  const businessSummary = extractSection(raw, "Business Summary") || "";
  const businessDetails = extractSection(raw, "What You Do") || "";
  const keyFacts = extractSection(raw, "Key Facts") || "";
  const policies = extractSection(raw, "Policies") || "";
  const links = extractSection(raw, "Links") || "";
  const ctaUrls = extractSection(raw, "CTA URLs") || "";
  const supportEmail = extractSection(raw, "Support Email") || "";
  const additional = extractSection(raw, "Additional Business Info") || "";

  return {
    businessSummary,
    businessDetails,
    keyFacts,
    policies,
    links,
    ctaUrls,
    supportEmail,
    additionalBusinessInfo:
      additional || (hasStructuredSections(raw) ? "" : raw.trim()),
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
    form.intro ||
      "Optional. If empty, introduce yourself naturally only once when the conversation starts.",
    "",
    SECTION_HEADER("Scope & Boundaries"),
    form.scope ||
      "Optional. Define what the assistant should and should not answer.",
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

function hasAdvancedContent(form: AssistantForm) {
  return (
    form.intro.trim().length > 0 ||
    form.scope.trim().length > 0 ||
    form.styleRules.trim().length > 0 ||
    form.additionalInstructions.trim().length > 0 ||
    form.qualificationPrompt.trim().length > 0 ||
    form.links.trim().length > 0 ||
    form.additionalBusinessInfo.trim().length > 0
  );
}

const REQUIRED_FIELDS: Array<{
  key: keyof AssistantForm;
  labelKey:
    | "businessSummary.label"
    | "businessDetails.label"
    | "keyFacts.label"
    | "ctaUrls.label"
    | "supportEmail.label";
}> = [
  { key: "businessSummary", labelKey: "businessSummary.label" },
  { key: "businessDetails", labelKey: "businessDetails.label" },
  { key: "keyFacts", labelKey: "keyFacts.label" },
  { key: "ctaUrls", labelKey: "ctaUrls.label" },
  { key: "supportEmail", labelKey: "supportEmail.label" },
];

export default function SettingsAssistantPage() {
  const router = useRouter();
  const t = useTranslations("AssistantSettings");

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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
  const [ackAuthorized, setAckAuthorized] = useState(false);
  const [settingsEnvelope, setSettingsEnvelope] =
    useState<AssistantSettingsEnvelope | null>(null);
  const [billingPlan, setBillingPlan] = useState<string>("basic");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [autofillUrl, setAutofillUrl] = useState("");
  const [autofilling, setAutofilling] = useState(false);
  const [autofillMode, setAutofillMode] = useState<"merge" | "replace" | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexingMode, setIndexingMode] = useState<"website" | "single_page" | null>(null);
  const [indexSummary, setIndexSummary] = useState<IndexSummary | null>(null);
  const [indexSummaryLoading, setIndexSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"assistant" | "indexed">("assistant");
  const [indexPage, setIndexPage] = useState(1);
  const indexLimit = 20;

  const initialAssistant = useRef<AssistantState | null>(null);
  const publishedFormRef = useRef<AssistantForm | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<"quick" | "advanced">("quick");

  const isBasicPlan = billingPlan === "basic";
  const canUseAdvancedSetup = !isBasicPlan;
  const canUseWebsiteIndexing = !isBasicPlan;

  // --- UI parity buttons ---
  const btnBase =
    "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-60 disabled:!cursor-not-allowed";

  const btnBrand = `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;

  const btnNeutral = `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const loadIndexSummary = async (page = indexPage) => {
    setIndexSummaryLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setIndexSummary(null);
        return;
      }
      const res = await fetch(`/api/knowledge/index-summary?page=${page}&limit=${indexLimit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const j: {
        error?: string;
        totals?: IndexSummary["totals"];
        pagination?: IndexSummary["pagination"];
        runs?: IndexRun[];
        documents?: IndexedDocument[];
      } =
        await res.json().catch(() => ({}));
      if (!res.ok || !j.totals) {
        setIndexSummary(null);
        return;
      }
      setIndexSummary({
        totals: j.totals,
        pagination: j.pagination ?? { page, limit: indexLimit },
        runs: j.runs ?? [],
        documents: j.documents ?? [],
      });
    } finally {
      setIndexSummaryLoading(false);
    }
  };

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
      setUserId(uid);

      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            system_prompt,
            qualification_prompt,
            knowledge,
            assistant_settings,
            allowed_domains,
            billing_plan
          )
        `,
        )
        .eq("id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[settings-assistant] join error:", error.message);
        setMsgTone("error");
        setMsg("Could not load your assistant settings.");
        return;
      }

      if (!isProfileJoinRow(data)) {
        setMsgTone("error");
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
        const settings = (biz.assistant_settings ?? null) as AssistantSettingsEnvelope | null;
        setBillingPlan((biz.billing_plan ?? "basic").toLowerCase());
        setSettingsEnvelope(settings);
        const domains = (biz.allowed_domains ?? [])
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d && !d.startsWith("www."));
        setAllowedDomains(domains);
        if (domains[0]) {
          setAutofillUrl(`https://${domains[0]}`);
        }
        const draftForm = settings?.draft?.form ?? null;
        const systemFromSettings = settings?.system ?? {};
        const knowledgeFromSettings = settings?.knowledge ?? {};

        setAssistant(next);
        const nextFormBase: AssistantForm = {
          tone: systemFromSettings.tone ?? parsedSystem.tone,
          goal: systemFromSettings.goal ?? parsedSystem.goal,
          handoff: systemFromSettings.handoff ?? parsedSystem.handoff,
          cta: systemFromSettings.cta ?? parsedSystem.cta,
          intro: systemFromSettings.intro ?? parsedSystem.intro,
          scope: systemFromSettings.scope ?? parsedSystem.scope,
          styleRules: systemFromSettings.styleRules ?? parsedSystem.styleRules,
          additionalInstructions:
            systemFromSettings.additionalInstructions ??
            parsedSystem.additionalInstructions,
          businessSummary:
            knowledgeFromSettings.businessSummary ?? parsedKnowledge.businessSummary,
          businessDetails:
            knowledgeFromSettings.businessDetails ?? parsedKnowledge.businessDetails,
          keyFacts: knowledgeFromSettings.keyFacts ?? parsedKnowledge.keyFacts,
          policies: knowledgeFromSettings.policies ?? parsedKnowledge.policies,
          links: knowledgeFromSettings.links ?? parsedKnowledge.links,
          ctaUrls: knowledgeFromSettings.ctaUrls ?? parsedKnowledge.ctaUrls,
          supportEmail:
            knowledgeFromSettings.supportEmail ?? parsedKnowledge.supportEmail,
          additionalBusinessInfo:
            knowledgeFromSettings.additionalBusinessInfo ??
            parsedKnowledge.additionalBusinessInfo,
          qualificationPrompt: next.qualification_prompt,
        };
        const nextForm: AssistantForm = {
          ...nextFormBase,
          ...(draftForm ?? {}),
        };

        setForm((f) => ({
          ...f,
          ...nextForm,
        }));
        publishedFormRef.current = nextFormBase;
        setAckAuthorized(false);
        setEditorMode(hasAdvancedContent(nextForm) ? "advanced" : "quick");

        initialAssistant.current = next;
        if (settings?.draft?.savedAt) {
          setMsgTone("success");
          setMsg(t("workflow.loadedDraft"));
        }
      } else {
        setBusinessId(null);
        setBillingPlan("basic");
        setSettingsEnvelope(null);
        const empty = {
          system_prompt: "",
          qualification_prompt: "",
          knowledge: "",
        };
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
        publishedFormRef.current = null;
        initialAssistant.current = empty;
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void loadIndexSummary(1);
  }, []);

  useEffect(() => {
    if (activeTab !== "indexed") return;
    void loadIndexSummary(indexPage);
  }, [activeTab, indexPage]);

  useEffect(() => {
    if (!canUseAdvancedSetup && editorMode === "advanced") {
      setEditorMode("quick");
    }
  }, [canUseAdvancedSetup, editorMode]);

  useEffect(() => {
    if (!canUseWebsiteIndexing && activeTab === "indexed") {
      setActiveTab("assistant");
    }
  }, [canUseWebsiteIndexing, activeTab]);

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

  const missingRequired = useMemo(() => {
    return REQUIRED_FIELDS.filter(({ key }) => form[key].trim().length === 0).map(
      ({ key }) => key,
    );
  }, [form]);

  const fieldStatuses = useMemo(() => {
    const status: Record<string, "suggested" | "needs_review" | "missing"> = {};
    for (const { key } of REQUIRED_FIELDS) {
      status[key] = form[key].trim().length > 0 ? "needs_review" : "missing";
    }
    return status;
  }, [form]);

  const mergedFieldStatus = (key: keyof AssistantForm): "suggested" | "needs_review" | "missing" => {
    const fromDraft = settingsEnvelope?.draft?.fieldStatuses?.[key];
    if (fromDraft === "suggested" || fromDraft === "needs_review" || fromDraft === "missing") {
      if (form[key].trim().length === 0) return "missing";
      return fromDraft === "missing" ? "needs_review" : fromDraft;
    }
    return fieldStatuses[key] ?? "needs_review";
  };

  const statusBadge = (key: keyof AssistantForm) => {
    const status = mergedFieldStatus(key);
    const cls =
      status === "suggested"
        ? "text-emerald-300 border-emerald-800/70 bg-emerald-900/20"
        : status === "missing"
          ? "text-amber-300 border-amber-800/70 bg-amber-900/20"
          : "text-zinc-300 border-zinc-700 bg-zinc-900/40";
    return (
      <span className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] ${cls}`}>
        {t(`autofill.status.${status}`)}
      </span>
    );
  };

  const clearField = (key: keyof AssistantForm) => {
    setForm((prev) => ({ ...prev, [key]: "" }));
  };

  const revertField = (key: keyof AssistantForm) => {
    const published = publishedFormRef.current;
    setForm((prev) => ({
      ...prev,
      [key]: published ? published[key] : "",
    }));
  };

  const fieldActions = (key: keyof AssistantForm) => (
    mergedFieldStatus(key) === "suggested" ? (
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => clearField(key)}
          className="rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-900/60"
        >
          {t("actions.clearField")}
        </button>
        <button
          type="button"
          onClick={() => revertField(key)}
          className="rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-900/60"
        >
          {t("actions.revertField")}
        </button>
      </div>
    ) : null
  );

  const getAdvancedRecommendation = (field: AdvancedRecField): AdvancedRecommendation | null =>
    settingsEnvelope?.draft?.advancedRecommendations?.[field] ?? null;

  const setAdvancedRecommendation = (
    field: AdvancedRecField,
    value: AdvancedRecommendation | null,
  ) => {
    setSettingsEnvelope((prev) => {
      if (!prev) return prev;
      const draft = prev.draft ?? {};
      const nextRecs = { ...(draft.advancedRecommendations ?? {}) };
      if (!value) delete nextRecs[field];
      else nextRecs[field] = value;
      return {
        ...prev,
        draft: {
          ...draft,
          advancedRecommendations: nextRecs,
        },
      };
    });
  };

  const renderAdvancedRecommendation = (field: AdvancedRecField) => {
    const rec = getAdvancedRecommendation(field);
    if (!rec?.value?.trim()) return null;
    return (
      <div className="mt-2 rounded-md border border-emerald-900/60 bg-emerald-950/20 p-2">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="rounded-full border border-emerald-800/70 px-2 py-0.5 text-emerald-300">
            {t(`recommendations.confidence.${rec.confidence}`)}
          </span>
          <span className="text-zinc-400">{rec.rationale}</span>
        </div>
        <pre className="whitespace-pre-wrap text-[11px] text-zinc-300">{rec.value}</pre>
        {rec.sources?.length ? (
          <div className="mt-1 text-[10px] text-zinc-500">
            {t("recommendations.sources")}: {rec.sources.slice(0, 3).join(", ")}
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, [field]: rec.value }));
              setAdvancedRecommendation(field, null);
            }}
            className="rounded-md border border-emerald-800/70 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-900/30"
          >
            {t("recommendations.apply")}
          </button>
          <button
            type="button"
            onClick={() => setAdvancedRecommendation(field, null)}
            className="rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-900/60"
          >
            {t("recommendations.keepOriginal")}
          </button>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, [field]: "" }))}
            className="rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-900/60"
          >
            {t("recommendations.clear")}
          </button>
        </div>
      </div>
    );
  };

  const runAutofill = async (mode: "merge" | "replace") => {
    setMsg(null);
    if (!autofillUrl.trim()) {
      setMsgTone("error");
      setMsg(t("autofill.missingUrl"));
      return;
    }
    setAutofilling(true);
    setAutofillMode(mode);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMsgTone("error");
        setMsg(t("workflow.loginRequired"));
        return;
      }

      const res = await fetch("/api/settings/assistant/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: autofillUrl.trim(), mode }),
      });
      const j: {
        error?: string;
        mode?: "merge" | "replace";
        sourceUrl?: string;
        fetchedAt?: string;
        pagesCrawled?: number;
        draftForm?: Partial<AssistantForm>;
        fieldStatuses?: Record<string, "suggested" | "needs_review" | "missing">;
        advancedRecommendations?: Partial<Record<AdvancedRecField, AdvancedRecommendation>>;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !j.draftForm) {
        setMsgTone("error");
        setMsg(`${t("autofill.error")}: ${j.error || "unknown"}`);
        return;
      }

      setForm((prev) => {
        const next = mode === "replace" ? { ...prev } : { ...prev };
        const writable = next as Record<string, string>;
        if (mode === "replace") {
          for (const key of Object.keys(j.draftForm ?? {})) {
            writable[key] = "";
          }
        }
        for (const [key, val] of Object.entries(j.draftForm ?? {})) {
          if (typeof val !== "string") continue;
          if (!val.trim()) continue;
          if (mode === "replace") {
            writable[key] = val;
            continue;
          }
          if (!(writable[key] ?? "").trim()) writable[key] = val;
        }
        return next;
      });

      const suggestedKeys = new Set(Object.entries(j.fieldStatuses ?? {})
        .filter(([, status]) => status === "suggested")
        .map(([k]) => k));
      const fieldProvenance: Record<string, "manual" | "suggested"> = {};
      for (const key of Object.keys(j.draftForm ?? {})) {
        fieldProvenance[key] = suggestedKeys.has(key) ? "suggested" : "manual";
      }

      setSettingsEnvelope((prev) => ({
        ...(prev ?? {}),
        draft: {
          form: j.draftForm ?? {},
          sourceUrl: j.sourceUrl ?? autofillUrl.trim(),
          fieldStatuses: j.fieldStatuses ?? {},
          fieldProvenance,
          generationMode: j.mode ?? mode,
          generatorVersion: "autofill-v2",
          advancedRecommendations: j.advancedRecommendations ?? {},
          savedAt: j.fetchedAt ?? new Date().toISOString(),
          savedBy: userId ?? undefined,
        },
        workflow: {
          ...(prev?.workflow ?? {}),
          lastDraftSavedAt: j.fetchedAt ?? new Date().toISOString(),
          lastDraftSavedBy: userId ?? undefined,
        },
      }));
      setMsgTone("success");
      setMsg(
        t(mode === "replace" ? "autofill.successReplaceWithPages" : "autofill.successWithPages", {
          count: j.pagesCrawled ?? 1,
        }),
      );
    } catch (e) {
      console.error("[settings-assistant] autofill", e);
      setMsgTone("error");
      setMsg(t("autofill.error"));
    } finally {
      setAutofilling(false);
      setAutofillMode(null);
    }
  };

  const runIndexing = async (mode: "website" | "single_page") => {
    setMsg(null);
    if (!autofillUrl.trim()) {
      setMsgTone("error");
      setMsg(t("autofill.missingUrl"));
      return;
    }
    setIndexing(true);
    setIndexingMode(mode);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setMsgTone("error");
        setMsg(t("workflow.loginRequired"));
        return;
      }
      const res = await fetch("/api/knowledge/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: autofillUrl.trim(), mode }),
      });
      const j: { error?: string; pagesScanned?: number; documentsUpserted?: number; chunksUpserted?: number } =
        await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsgTone("error");
        setMsg(`${t("autofill.indexError")}: ${j.error || "unknown"}`);
        return;
      }
      setMsgTone("success");
      setMsg(
        t("autofill.indexSuccess", {
          pages: j.pagesScanned ?? 0,
          docs: j.documentsUpserted ?? 0,
          chunks: j.chunksUpserted ?? 0,
        }),
      );
      setIndexPage(1);
      void loadIndexSummary(1);
    } catch (e) {
      console.error("[settings-assistant] index", e);
      setMsgTone("error");
      setMsg(t("autofill.indexError"));
    } finally {
      setIndexing(false);
      setIndexingMode(null);
    }
  };

  const saveDraft = async () => {
    setMsg(null);
    if (!dirty) return;

    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const uid = sess.session?.user?.id ?? userId;
      if (!token || !uid) {
        setMsgTone("error");
        setMsg(t("workflow.loginRequired"));
        setUnauth(true);
        return;
      }

      const now = new Date().toISOString();
      const previous = settingsEnvelope ?? {};
      const nextEnvelope: AssistantSettingsEnvelope = {
        ...previous,
        system: previous.system ?? toAssistantSettings(sanitizeForm(form)).system,
        knowledge:
          previous.knowledge ?? toAssistantSettings(sanitizeForm(form)).knowledge,
        draft: {
          form,
          sourceUrl: previous.draft?.sourceUrl ?? null,
          fieldStatuses,
          savedAt: now,
          savedBy: uid,
        },
        workflow: {
          ...(previous.workflow ?? {}),
          lastDraftSavedAt: now,
          lastDraftSavedBy: uid,
          lastMissingRequired: missingRequired.map(String),
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
            assistant_settings: nextEnvelope,
          },
        }),
      });

      const j: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsgTone("error");
        setMsg(`${t("workflow.saveDraftError")}: ${j.error || "unknown"}`);
        return;
      }

      setSettingsEnvelope(nextEnvelope);
      setMsgTone("success");
      setMsg(t("workflow.draftSaved"));
    } catch (e) {
      console.error("[settings-assistant] saveDraft", e);
      setMsgTone("error");
      setMsg(t("workflow.saveDraftError"));
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setMsg(null);
    if (!dirty) return;
    if (missingRequired.length > 0) {
      setMsgTone("error");
      setMsg(t("workflow.missingRequiredError"));
      return;
    }
    if (!ackAuthorized) {
      setMsgTone("error");
      setMsg(t("workflow.ackRequiredError"));
      return;
    }

    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const uid = sess.session?.user?.id ?? userId;
      if (!token || !uid) {
        setMsgTone("error");
        setMsg(t("workflow.loginRequired"));
        setUnauth(true);
        return;
      }

      const sanitizedForm = sanitizeForm(form);
      const composedSystem = composeSystemPrompt(sanitizedForm);
      const composedKnowledge = composeKnowledge(sanitizedForm);
      const now = new Date().toISOString();

      const nextEnvelope: AssistantSettingsEnvelope = {
        ...(settingsEnvelope ?? {}),
        ...toAssistantSettings(sanitizedForm),
        draft: null,
        workflow: {
          ...(settingsEnvelope?.workflow ?? {}),
          lastPublishedAt: now,
          lastPublishedBy: uid,
          lastMissingRequired: [],
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
            system_prompt: composedSystem,
            qualification_prompt: sanitizedForm.qualificationPrompt,
            knowledge: composedKnowledge,
            assistant_settings: nextEnvelope,
          },
        }),
      });

      const j: {
        error?: string;
        business?: {
          system_prompt?: string | null;
          qualification_prompt?: string | null;
          knowledge?: string | null;
          assistant_settings?: AssistantSettingsEnvelope | null;
        };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsgTone("error");
        setMsg(`${t("workflow.publishError")}: ${j.error || "unknown"}`);
        return;
      }

      const next: AssistantState = {
        system_prompt: (
          j.business?.system_prompt ?? composeSystemPrompt(sanitizedForm)
        ).trim(),
        qualification_prompt: (
          j.business?.qualification_prompt ?? sanitizedForm.qualificationPrompt
        ).trim(),
        knowledge: (j.business?.knowledge ?? composeKnowledge(sanitizedForm)).trim(),
      };

      initialAssistant.current = next;
      setAssistant(next);
      publishedFormRef.current = sanitizedForm;
      setSettingsEnvelope((j.business?.assistant_settings ?? nextEnvelope) as AssistantSettingsEnvelope);
      setAckAuthorized(false);
      setMsgTone("success");
      setMsg(t("workflow.published"));
    } catch (e) {
      console.error("[settings-assistant] publish", e);
      setMsgTone("error");
      setMsg(t("workflow.publishError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="p-4 text-sm text-zinc-400">{t("loading")}</p>;

  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">
          {t("loginRequired.title")}
        </h1>
        <p className="text-sm text-zinc-400 mb-4">{t("loginRequired.body")}</p>
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
        <p className="text-sm text-zinc-400">{t("noBusiness.body")}</p>
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
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      <p className="mb-6 text-sm text-zinc-400">{t("description")}</p>
      {msg && (
        <div
          className={`mb-4 text-sm ${msgTone === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {msg}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("assistant")}
          className={activeTab === "assistant" ? btnBrand : btnNeutral}
        >
          {t("tabs.assistant")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("indexed")}
          disabled={!canUseWebsiteIndexing}
          className={activeTab === "indexed" ? btnBrand : btnNeutral}
        >
          {t("tabs.indexed")}
        </button>
      </div>
      {!canUseWebsiteIndexing ? (
        <p className="mb-4 text-xs text-amber-300">{t("plans.indexingUpgradeHint")}</p>
      ) : null}

      <div className={activeTab === "assistant" ? "" : "hidden"}>
      {canUseWebsiteIndexing ? (
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="text-sm font-semibold text-zinc-100">{t("autofill.title")}</div>
        <p className="text-xs text-zinc-400">{t("autofill.desc")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void runAutofill("merge")}
            disabled={autofilling}
            className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-medium text-brand-200 ring-1 ring-inset ring-brand-500/25 transition-colors hover:bg-brand-500/15 disabled:opacity-60"
          >
            {autofilling && autofillMode === "merge" ? t("autofill.loading") : t("autofill.action")}
          </button>
          <button
            type="button"
            onClick={() => void runAutofill("replace")}
            disabled={autofilling}
            className="rounded-lg bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-900/80 disabled:opacity-60"
          >
            {autofilling && autofillMode === "replace"
              ? t("autofill.loading")
              : t("autofill.replaceAction")}
          </button>
          <button
            type="button"
            onClick={() => void runIndexing("website")}
            disabled={indexing || !canUseWebsiteIndexing}
            className="rounded-lg bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-900/80 disabled:opacity-60"
          >
            {indexing && indexingMode === "website"
              ? t("autofill.indexing")
              : t("autofill.indexWebsiteAction")}
          </button>
          <button
            type="button"
            onClick={() => void runIndexing("single_page")}
            disabled={indexing || !canUseWebsiteIndexing}
            className="rounded-lg bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-200 ring-1 ring-inset ring-zinc-700 transition-colors hover:bg-zinc-900/80 disabled:opacity-60"
          >
            {indexing && indexingMode === "single_page"
              ? t("autofill.indexing")
              : t("autofill.indexSinglePageAction")}
          </button>
          <input
            className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            value={autofillUrl}
            onChange={(e) => setAutofillUrl(e.target.value)}
            placeholder={t("autofill.placeholder")}
          />
        </div>
        {allowedDomains.length > 0 ? (
          <p className="text-[11px] text-zinc-500">
            {t("autofill.allowed")}: {allowedDomains.join(", ")}
          </p>
        ) : null}
      </section>
      ) : (
      <section className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
        <div className="text-sm font-semibold text-amber-200">{t("autofill.title")}</div>
        <p className="text-xs text-amber-300">{t("plans.indexingUpgradeHint")}</p>
      </section>
      )}

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="text-sm font-semibold text-zinc-100">{t("workflow.title")}</div>
        <div className="text-xs leading-6 text-zinc-300">
          <span>{t("workflow.desc")}</span>
          <span className="mx-2 text-zinc-500">•</span>
          <span>
            {t("workflow.lastDraft")}:{" "}
            <span className="text-zinc-400">
              {settingsEnvelope?.workflow?.lastDraftSavedAt || t("workflow.never")}
            </span>
          </span>
          <span className="mx-2 text-zinc-500">•</span>
          <span>
            {t("workflow.lastPublished")}:{" "}
            <span className="text-zinc-400">
              {settingsEnvelope?.workflow?.lastPublishedAt || t("workflow.never")}
            </span>
          </span>
          <span className="mx-2 text-zinc-500">•</span>
          <span>
            {t("workflow.missingRequired")} ({missingRequired.length})
          </span>
          <span className="mx-2 text-zinc-500">•</span>
          <span className={missingRequired.length === 0 ? "text-green-300" : "text-amber-300"}>
            {missingRequired.length === 0
              ? t("workflow.noneMissing")
              : REQUIRED_FIELDS.filter(({ key }) => missingRequired.includes(key))
                  .map(({ labelKey }) => t(labelKey))
                  .join(", ")}
          </span>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="text-sm font-semibold text-zinc-100 mb-2">
            {t("mode.title")}
          </div>
          <p className="text-xs text-zinc-400 mb-3">{t("mode.desc")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditorMode("quick")}
              className={editorMode === "quick" ? btnBrand : btnNeutral}
            >
              {t("mode.quick")}
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("advanced")}
              disabled={!canUseAdvancedSetup}
              className={editorMode === "advanced" ? btnBrand : btnNeutral}
            >
              {t("mode.advanced")}
            </button>
          </div>
          {!canUseAdvancedSetup ? (
            <p className="mt-2 text-[11px] text-amber-300">{t("plans.advancedUpgradeHint")}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="grid gap-4 grid-cols-1">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">
                    {t("tone.label")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["friendly", "professional", "concise"] as PresetTone[]
                    ).map((opt) => (
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
                  <label className="block text-xs text-zinc-400 mb-2">
                    {t("goal.label")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["support", "leads", "bookings", "mixed"] as PresetGoal[]
                    ).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, goal: opt }))}
                        disabled={isBasicPlan}
                        className={`${opt === form.goal ? btnBrand : btnNeutral}`}
                      >
                        {t(`goal.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">
                    {t("handoff.label")}
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-2">
                    {t("handoff.help")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["balanced", "proactive"] as PresetHandoff[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, handoff: opt }))
                          }
                          disabled={isBasicPlan}
                          className={`${opt === form.handoff ? btnBrand : btnNeutral}`}
                        >
                          {t(`handoff.options.${opt}`)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <label className="block text-xs text-zinc-400 mb-2">
                    {t("cta.label")}
                  </label>
                  <p className="text-[11px] text-zinc-500 mb-2">
                    {t("cta.help")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["soft", "direct"] as PresetCta[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cta: opt }))}
                        disabled={isBasicPlan}
                        className={`${opt === form.cta ? btnBrand : btnNeutral}`}
                      >
                        {t(`cta.options.${opt}`)}
                      </button>
                    ))}
                  </div>
                </div>
                </div>
                {isBasicPlan ? (
                  <p className="mt-3 text-[11px] text-amber-300">{t("plans.basicToneOnlyHint")}</p>
                ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">
            {t("sections.business.title")}
          </div>
          <p className="text-xs text-zinc-400">{t("sections.business.desc")}</p>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("businessSummary.label")}
              {statusBadge("businessSummary")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("businessSummary.help")}
            </p>
            <textarea
              className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.businessSummary}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessSummary: e.target.value }))
              }
            />
            {fieldActions("businessSummary")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("supportEmail.label")}
              {statusBadge("supportEmail")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("supportEmail.help")}
            </p>
            <input
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.supportEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, supportEmail: e.target.value }))
              }
            />
            {fieldActions("supportEmail")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("ctaUrls.label")}
              {statusBadge("ctaUrls")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("ctaUrls.help")}
            </p>
            <textarea
              className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.ctaUrls}
              onChange={(e) =>
                setForm((f) => ({ ...f, ctaUrls: e.target.value }))
              }
            />
            {fieldActions("ctaUrls")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("businessDetails.label")}
              {statusBadge("businessDetails")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("businessDetails.help")}
            </p>
            <textarea
              className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.businessDetails}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessDetails: e.target.value }))
              }
            />
            {fieldActions("businessDetails")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("keyFacts.label")}
              {statusBadge("keyFacts")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("keyFacts.help")}
            </p>
            <textarea
              className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.keyFacts}
              onChange={(e) =>
                setForm((f) => ({ ...f, keyFacts: e.target.value }))
              }
            />
            {fieldActions("keyFacts")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("policies.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("policies.help")}
            </p>
            <textarea
              className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.policies}
              onChange={(e) =>
                setForm((f) => ({ ...f, policies: e.target.value }))
              }
            />
            {fieldActions("policies")}
          </div>

          {editorMode === "advanced" ? (
            <>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("links.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">{t("links.help")}</p>
                <textarea
                  className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  value={form.links}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, links: e.target.value }))
                  }
                />
                {fieldActions("links")}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  {t("additionalBusinessInfo.label")}
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">
                  {t("additionalBusinessInfo.help")}
                </p>
                <textarea
                  className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
                  value={form.additionalBusinessInfo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      additionalBusinessInfo: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400">
              {t("mode.quickHint")}
            </div>
          )}
        </div>

        {editorMode === "advanced" ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">
            {t("sections.behavior.title")}
          </div>
          <p className="text-xs text-zinc-400">{t("sections.behavior.desc")}</p>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("intro.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">{t("intro.help")}</p>
            <textarea
              className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
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
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({ ...f, scope: e.target.value }))
              }
            />
            {renderAdvancedRecommendation("scope")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("style.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">{t("style.help")}</p>
            <textarea
              className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.styleRules}
              onChange={(e) =>
                setForm((f) => ({ ...f, styleRules: e.target.value }))
              }
            />
            {renderAdvancedRecommendation("styleRules")}
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("additionalInstructions.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("additionalInstructions.help")}
            </p>
            <textarea
              className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.additionalInstructions}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  additionalInstructions: e.target.value,
                }))
              }
            />
            {renderAdvancedRecommendation("additionalInstructions")}
          </div>
          </div>
        ) : null}

        {editorMode === "advanced" ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-sm font-semibold text-zinc-100">
            {t("sections.qualification.title")}
          </div>
          <p className="text-xs text-zinc-400">
            {t("sections.qualification.desc")}
          </p>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t("qualification.label")}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {t("qualification.help")}
            </p>
            <textarea
              className="w-full min-h-[220px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
              value={form.qualificationPrompt}
              onChange={(e) =>
                setForm((f) => ({ ...f, qualificationPrompt: e.target.value }))
              }
            />
            {renderAdvancedRecommendation("qualificationPrompt")}
          </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <label className="flex items-start gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={ackAuthorized}
              onChange={(e) => setAckAuthorized(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t("workflow.ack")}</span>
          </label>
        <div className="flex gap-2">
          <button
            onClick={saveDraft}
            disabled={!dirty || saving}
            className={btnBrand}
          >
            {saving ? t("actions.saving") : t("actions.saveDraft")}
          </button>

          <button
            onClick={publish}
            disabled={!dirty || saving}
            className={btnNeutral}
          >
            {saving ? t("actions.publishing") : t("actions.publish")}
          </button>

          <button onClick={() => void load()} className={btnNeutral}>
            {t("actions.reset")}
          </button>
        </div>
        </div>
      </section>
      </div>

      <div className={activeTab === "indexed" ? "" : "hidden"}>
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-100">{t("autofill.monitor.title")}</div>
            <button
              type="button"
              onClick={() => void loadIndexSummary(indexPage)}
              className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900/70"
            >
              {t("autofill.monitor.refresh")}
            </button>
          </div>
          {indexSummaryLoading ? (
            <p className="text-xs text-zinc-400">{t("autofill.monitor.loading")}</p>
          ) : indexSummary ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
                <span className="rounded-md border border-zinc-700 px-2 py-1">
                  {t("autofill.monitor.docs")}: {indexSummary.totals.documents}
                </span>
                <span className="rounded-md border border-zinc-700 px-2 py-1">
                  {t("autofill.monitor.chunks")}: {indexSummary.totals.chunks}
                </span>
                <span className="rounded-md border border-zinc-700 px-2 py-1">
                  {t("autofill.monitor.runs")}: {indexSummary.runs.length}
                </span>
              </div>
              {indexSummary.runs.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-zinc-400">
                    {t("autofill.monitor.latestRun")}
                  </div>
                  <div className="rounded-md border border-zinc-800 px-2 py-2 text-[11px] text-zinc-300">
                    <div>
                      {t("autofill.monitor.status")}: {indexSummary.runs[0]?.status ?? "unknown"}
                    </div>
                    <div>
                      {t("autofill.monitor.started")}: {formatDateTime(indexSummary.runs[0]?.started_at)}
                    </div>
                    <div>
                      {t("autofill.monitor.finished")}: {formatDateTime(indexSummary.runs[0]?.finished_at)}
                    </div>
                    <div>
                      {t("autofill.monitor.scanned")}: {indexSummary.runs[0]?.pages_scanned ?? 0} ·{" "}
                      {t("autofill.monitor.docs")}: {indexSummary.runs[0]?.documents_upserted ?? 0} ·{" "}
                      {t("autofill.monitor.chunks")}: {indexSummary.runs[0]?.chunks_upserted ?? 0}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                {indexSummary.documents.length === 0 ? (
                  <div className="text-xs text-zinc-500">{t("autofill.monitor.emptyDocs")}</div>
                ) : (
                  indexSummary.documents.map((doc) => (
                    <div key={doc.id} className="rounded-md border border-zinc-800 p-2">
                      <div className="truncate text-[11px] text-zinc-200">
                        {doc.source_url || doc.source_label || "Untitled"}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {t("autofill.monitor.updated")}: {formatDateTime(doc.updated_at)} · {t("autofill.monitor.chunks")}:
                        {" "}{doc.chunkCount}
                      </div>
                      {doc.preview ? (
                        <p className="mt-1 max-h-8 overflow-hidden text-[11px] text-zinc-400">{doc.preview}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              {indexSummary.totals.documents > indexLimit ? (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={indexPage <= 1}
                    onClick={() => setIndexPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900/70 disabled:opacity-40"
                  >
                    {t("tabs.prev")}
                  </button>
                  <div className="text-[11px] text-zinc-400">
                    {t("tabs.page")} {indexSummary.pagination.page} /{" "}
                    {Math.max(1, Math.ceil(indexSummary.totals.documents / indexSummary.pagination.limit))}
                  </div>
                  <button
                    type="button"
                    disabled={indexPage >= Math.ceil(indexSummary.totals.documents / indexSummary.pagination.limit)}
                    onClick={() =>
                      setIndexPage((p) =>
                        Math.min(Math.ceil(indexSummary.totals.documents / indexSummary.pagination.limit), p + 1),
                      )
                    }
                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900/70 disabled:opacity-40"
                  >
                    {t("tabs.next")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">{t("autofill.monitor.empty")}</p>
          )}
        </section>
      </div>

      {activeTab === "assistant" && dirty ? (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <div className="mx-auto max-w-5xl rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-zinc-400">{t("actions.unsaved")}</div>
              <label className="mt-2 flex items-start gap-2 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={ackAuthorized}
                  onChange={(e) => setAckAuthorized(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{t("workflow.ack")}</span>
              </label>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={saveDraft} disabled={saving} className={btnBrand}>
                {saving ? t("actions.saving") : t("actions.saveDraft")}
              </button>
              <button onClick={publish} disabled={saving} className={btnNeutral}>
                {saving ? t("actions.publishing") : t("actions.publish")}
              </button>
              <button onClick={() => void load()} className={btnNeutral}>
                {t("actions.reset")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
