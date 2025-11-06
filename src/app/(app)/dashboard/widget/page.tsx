// app/(app)/dashboard/widget/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

/* ---------- Types ---------- */
type BizLocal = {
  id: string;
  slug: string;
  system_prompt: string | null;
  allowed_domains: string[];
};

type Theme = {
  headerBg: string;
  headerText: string;
  bubbleUser: string;
  bubbleBot: string;
  sendBg: string;
  sendText: string;
};

type WidgetJoinRow = {
  business_id: string | null;
  businesses: {
    id: string;
    slug: string;
    system_prompt: string | null;
    allowed_domains: string[] | null;
  } | null;
};

function isWidgetJoinRow(x: unknown): x is WidgetJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "business_id" in o && "businesses" in o;
}

export default function WidgetSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizLocal | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [brand, setBrand] = useState("Aliigo");
  const [theme, setTheme] = useState<Theme>({
    headerBg: "bg-gray-900",
    headerText: "text-white",
    bubbleUser: "bg-blue-600 text-white",
    bubbleBot: "bg-gray-100 text-gray-900",
    sendBg: "bg-blue-600",
    sendText: "text-white",
  });

  // Load user -> profile+business, then latest token (no `any`)
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;
      setUserId(uid);
      if (!uid) return;

      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
          business_id,
          businesses:business_id (
            id,
            slug,
            system_prompt,
            allowed_domains
          )
        `
        )
        .eq("id", uid)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[widget] profile join error:", error.message);
        return;
      }
      if (!isWidgetJoinRow(data) || !data.business_id || !data.businesses) {
        setBiz(null);
        return;
      }

      const b = data.businesses;
      setBiz({
        id: b.id,
        slug: b.slug,
        system_prompt: b.system_prompt,
        allowed_domains: b.allowed_domains ?? [],
      });

      const { data: t, error: tErr } = await supabase
        .from("embed_tokens")
        .select("token")
        .eq("business_id", data.business_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tErr && t?.token) setToken(t.token);
    })();
  }, []);

  const saveSettings = async () => {
    if (!userId) return;
    await fetch("/api/widget/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        system_prompt: biz?.system_prompt || "",
        allowed_domains: biz?.allowed_domains || [],
      }),
    });
    alert("Widget settings saved.");
  };

  const rotateToken = async () => {
    if (!userId) return;
    const res = await fetch("/api/widget/rotate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const j: { token?: string; error?: string } = await res.json();
    if (res.ok && j.token) setToken(j.token);
    else alert(j.error || "Error");
  };

  const embedCode = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
    const themeParam = encodeURIComponent(JSON.stringify(theme));
    const slug = biz?.slug || "horchata-labs";
    const tk = token || "SET_TOKEN";
    return [
      "<!-- Aliigo Chat Widget -->",
      "<script>",
      "(function(){",
      "  var iframe=document.createElement('iframe');",
      `  iframe.src='${base}/embed/chat?slug=${slug}&brand=${encodeURIComponent(
        brand
      )}&token=${tk}&theme=${themeParam}';`,
      "  iframe.style.position='fixed';",
      "  iframe.style.bottom='24px';",
      "  iframe.style.right='24px';",
      "  iframe.style.width='360px';",
      "  iframe.style.height='420px';",
      "  iframe.style.border='0';",
      "  iframe.style.zIndex='999999';",
      "  document.body.appendChild(iframe);",
      "})();",
      "</script>",
    ].join("\n");
  }, [biz?.slug, brand, theme, token]);

  if (!biz) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We couldn’t find a business associated with your profile. Complete your business
          details in Settings first, then return here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">Widget</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <section className="space-y-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-200">
              Allowed domains
            </label>
            <input
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm text-white"
              placeholder="example.com, store.example.com"
              value={biz.allowed_domains?.join(", ") || ""}
              onChange={(e) =>
                setBiz((b) =>
                  b
                    ? {
                        ...b,
                        allowed_domains: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }
                    : b
                )
              }
            />
            <p className="text-xs text-zinc-500 mt-1">
              Domains allowed to embed your widget.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-200">
              Assistant instructions
            </label>
            <textarea
              className="w-full border border-zinc-800 bg-zinc-950 rounded px-3 py-2 text-sm text-white"
              rows={6}
              value={biz.system_prompt || ""}
              onChange={(e) => setBiz((b) => (b ? { ...b, system_prompt: e.target.value } : b))}
            />
          </div>

          <div className="flex gap-2">
            <button className="bg-white text-black rounded px-4 py-2" onClick={saveSettings}>
              Save
            </button>
            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={rotateToken}
            >
              Rotate token
            </button>
          </div>

          <div className="text-sm text-zinc-400">
            Current token: <code className="text-zinc-300">{token || "—"}</code>
          </div>
        </section>

        {/* Live Preview */}
        <section className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <h2 className="font-semibold mb-2">Live preview</h2>
          <div className="relative h-[420px] border border-zinc-800 rounded bg-zinc-950">
            <AliigoChatWidget
              businessSlug={biz.slug}
              brand={brand}
              token={token ?? undefined}
              theme={theme}
            />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <label className="text-sm text-zinc-300">Brand</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />

            <label className="text-sm text-zinc-300">Header bg (Tailwind)</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerBg}
              onChange={(e) => setTheme((t) => ({ ...t, headerBg: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Header text</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerText}
              onChange={(e) => setTheme((t) => ({ ...t, headerText: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">User bubble</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleUser}
              onChange={(e) => setTheme((t) => ({ ...t, bubbleUser: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Bot bubble</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleBot}
              onChange={(e) => setTheme((t) => ({ ...t, bubbleBot: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Send bg</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendBg}
              onChange={(e) => setTheme((t) => ({ ...t, sendBg: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Send text</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendText}
              onChange={(e) => setTheme((t) => ({ ...t, sendText: e.target.value }))}
            />
          </div>
        </section>
      </div>

      {/* Embed snippet */}
      <section className="mt-8">
        <h2 className="font-semibold mb-2">Embed snippet</h2>
        <textarea
          className="w-full border border-zinc-800 bg-zinc-950 text-zinc-200 rounded px-3 py-2 text-xs"
          rows={10}
          value={embedCode}
          readOnly
        />
        <p className="text-xs text-zinc-500 mt-2">
          Paste before the closing <code>&lt;/body&gt;</code> tag of your site.
        </p>
      </section>
    </div>
  );
}
