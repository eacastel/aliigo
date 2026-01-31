// src/app/[locale]/(app)/dashboard/settings/assistant/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type AssistantState = {
  system_prompt: string;
  knowledge: string;
};

type JoinedBusiness = {
  id?: string | null;
  system_prompt?: string | null;
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

export default function SettingsAssistantPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [assistant, setAssistant] = useState<AssistantState>({
    system_prompt: "",
    knowledge: "",
  });

  const initialAssistant = useRef<AssistantState | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- UI parity with Billing + Messages buttons ---
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
          knowledge: (biz.knowledge ?? "").trim(),
        };

        setAssistant(next);
        initialAssistant.current = next;
      } else {
        setBusinessId(null);
        const empty = { system_prompt: "", knowledge: "" };
        setAssistant(empty);
        initialAssistant.current = empty;
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    const ia = initialAssistant.current;
    if (!ia) return false;
    return (
      assistant.system_prompt.trim() !== ia.system_prompt.trim() ||
      assistant.knowledge.trim() !== ia.knowledge.trim()
    );
  }, [assistant]);

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
      const payload = {
        business: {
          system_prompt: assistant.system_prompt,
          knowledge: assistant.knowledge,
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
        business?: { system_prompt?: string | null; knowledge?: string | null };
      } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(`Save error: ${j.error || "unknown"}`);
        return;
      }

      const next: AssistantState = {
        system_prompt: (j.business?.system_prompt ?? assistant.system_prompt).trim(),
        knowledge: (j.business?.knowledge ?? assistant.knowledge).trim(),
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

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            System prompt (style)
          </label>
          <textarea
            className="w-full min-h-[140px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Tone, rules, do/don’t…"
            value={assistant.system_prompt}
            onChange={(e) =>
              setAssistant((a) => ({ ...a, system_prompt: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            This controls tone + rules for the assistant across channels.
          </p>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Knowledge (facts / policies)
          </label>
          <textarea
            className="w-full min-h-[220px] border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm"
            placeholder="Hours, services, pricing policy, cancellations, locations, etc."
            value={assistant.knowledge}
            onChange={(e) =>
              setAssistant((a) => ({ ...a, knowledge: e.target.value }))
            }
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            This is injected as authoritative context. Keep it factual.
          </p>
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
