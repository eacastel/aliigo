// src/app/[locale]/(app)/dashboard/settings/assistant/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  intro: string;
  scope: string;
  styleRules: string;
  additionalInstructions: string;
  businessSummary: string;
  businessDetails: string;
  keyFacts: string;
  policies: string;
  links: string;
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
  const additional = extractSection(raw, "Additional Business Info") || "";

  return {
    businessSummary,
    businessDetails,
    keyFacts,
    policies,
    links,
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
    SECTION_HEADER("Additional Business Info"),
    form.additionalBusinessInfo || "",
  ]
    .join("\n")
    .trim();
}

export default function SettingsAssistantPage() {
  const router = useRouter();

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
    intro: "",
    scope: "",
    styleRules: "",
    additionalInstructions: "",
    businessSummary: "",
    businessDetails: "",
    keyFacts: "",
    policies: "",
    links: "",
    additionalBusinessInfo: "",
    qualificationPrompt: "",
  });

  const initialAssistant = useRef<AssistantState | null>(null);

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
          additionalBusinessInfo: parsedKnowledge.additionalBusinessInfo,
          qualificationPrompt: next.qualification_prompt,
        }));

        initialAssistant.current = next;
      } else {
        setBusinessId(null);
        const empty = { system_prompt: "", qualification_prompt: "", knowledge: "" };
        setAssistant(empty);
        setForm({
          tone: "friendly",
          goal: "mixed",
          handoff: "balanced",
          cta: "soft",
          intro: "",
          scope: "",
          styleRules: "",
          additionalInstructions: "",
          businessSummary: "",
          businessDetails: "",
          keyFacts: "",
          policies: "",
          links: "",
          additionalBusinessInfo: "",
          qualificationPrompt: "",
        });
        initialAssistant.current = empty;
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
      setMsg("Saved.");
    } catch (e: unknown) {
      console.error(e);
      setMsg("Could not save now. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-zinc-400">Cargando…</p>;

  if (unauth) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">Login required</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Please sign in to edit assistant settings.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-white text-black rounded px-4 py-2"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We didn’t find a business linked to your profile. Reload the page. If
          it persists, try signup again.
        </p>
        <button
          onClick={() => void load()}
          className="mt-3 border border-zinc-700 text-white rounded px-4 py-2 hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl text-white">
      <h1 className="text-2xl font-bold mb-4">Assistant</h1>

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg.startsWith("Saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg}
        </div>
      )}

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold text-zinc-100">Universal guardrails (always on)</div>
          <ul className="mt-2 text-xs text-zinc-400 space-y-1">
            <li>• Honest, factual answers only. No hallucinations.</li>
            <li>• Stay focused on the business. No jokes, trivia, or unrelated topics.</li>
            <li>• Avoid repetition. Summarize if asked again.</li>
            <li>• Always reply in the user’s language; follow if they switch.</li>
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <label className="block text-xs text-zinc-400 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {(["friendly", "professional", "concise"] as PresetTone[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tone: opt }))}
                  className={`${opt === form.tone ? btnBrand : btnNeutral}`}
                >
                  {opt === "friendly" ? "Friendly" : opt === "professional" ? "Professional" : "Concise"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <label className="block text-xs text-zinc-400 mb-2">Primary goal</label>
            <div className="flex flex-wrap gap-2">
              {(["support", "leads", "bookings", "mixed"] as PresetGoal[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, goal: opt }))}
                  className={`${opt === form.goal ? btnBrand : btnNeutral}`}
                >
                  {opt === "support"
                    ? "Support & FAQs"
                    : opt === "leads"
                      ? "Lead capture"
                      : opt === "bookings"
                        ? "Bookings"
                        : "Mixed"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <label className="block text-xs text-zinc-400 mb-2">Handoff behavior</label>
            <div className="flex flex-wrap gap-2">
              {(["rare", "balanced", "proactive"] as PresetHandoff[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, handoff: opt }))}
                  className={`${opt === form.handoff ? btnBrand : btnNeutral}`}
                >
                  {opt === "rare" ? "Rare" : opt === "balanced" ? "Balanced" : "Proactive"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <label className="block text-xs text-zinc-400 mb-2">CTA style</label>
            <div className="flex flex-wrap gap-2">
              {(["soft", "direct"] as PresetCta[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cta: opt }))}
                  className={`${opt === form.cta ? btnBrand : btnNeutral}`}
                >
                  {opt === "soft" ? "Soft guidance" : "Direct next step"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Introduction (optional)
          </label>
          <textarea
            className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Short greeting or intro (only once). Leave blank to keep it natural."
            value={form.intro}
            onChange={(e) =>
              setForm((f) => ({ ...f, intro: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">Optional. Keep it short and friendly.</p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Scope & boundaries (optional)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="What the assistant should and should not answer. Any sensitive topics to avoid."
            value={form.scope}
            onChange={(e) =>
              setForm((f) => ({ ...f, scope: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">Optional but recommended for clarity.</p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Style rules (optional)
          </label>
          <textarea
            className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Response length, formatting preferences, do/don’t..."
            value={form.styleRules}
            onChange={(e) =>
              setForm((f) => ({ ...f, styleRules: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">Optional. Keep it simple.</p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Business summary (required)
          </label>
          <textarea
            className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Who you are and what you do in 1–3 sentences."
            value={form.businessSummary}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessSummary: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            This anchors how the assistant describes your business.
          </p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            What you do (services / offers)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="List services, products, or key offerings."
            value={form.businessDetails}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessDetails: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Key facts (hours, location, pricing policy)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Hours, location, service area, booking rules, etc."
            value={form.keyFacts}
            onChange={(e) =>
              setForm((f) => ({ ...f, keyFacts: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Policies (cancellations, refunds, limitations)
          </label>
          <textarea
            className="w-full min-h-[120px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Cancellation windows, refunds, deposit rules, etc."
            value={form.policies}
            onChange={(e) =>
              setForm((f) => ({ ...f, policies: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Links (booking, contact, maps)
          </label>
          <textarea
            className="w-full min-h-[100px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="URLs the assistant should share."
            value={form.links}
            onChange={(e) =>
              setForm((f) => ({ ...f, links: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Additional business info (optional)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Anything else visitors should know."
            value={form.additionalBusinessInfo}
            onChange={(e) =>
              setForm((f) => ({ ...f, additionalBusinessInfo: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Qualification (fit + lead capture)
          </label>
          <textarea
            className="w-full min-h-[220px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Qualification flow, thresholds, when to ask for email/phone, next-step CTAs…"
            value={form.qualificationPrompt}
            onChange={(e) =>
              setForm((f) => ({ ...f, qualificationPrompt: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            This guides how the assistant qualifies and when it should collect contact info.
          </p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Additional instructions (optional)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Extra rules, nuances, or edge cases."
            value={form.additionalInstructions}
            onChange={(e) =>
              setForm((f) => ({ ...f, additionalInstructions: e.target.value }))
            }
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={btnBrand}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <button
            onClick={() => void load()}
            className={btnNeutral}
          >
            Reset changes
          </button>
        </div>
      </section>
    </div>
  );
}
