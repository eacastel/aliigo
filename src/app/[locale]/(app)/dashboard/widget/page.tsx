// src/app/(app)/dashboard/widget/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

/* ---------- Types ---------- */
type BizLocal = {
  id: string;
  slug: string;
  allowed_domains: string[];
  public_embed_key: string;
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
    allowed_domains: string[] | null;
    public_embed_key: string | null;
  } | null;
};

function isWidgetJoinRow(x: unknown): x is WidgetJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "business_id" in o && "businesses" in o;
}

function normalizeDomains(domains: string[]) {
  return domains
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .filter((d, i, a) => a.indexOf(d) === i);
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.vercel.app";
}

export default function WidgetSettingsPage() {
  const [biz, setBiz] = useState<BizLocal | null>(null);

  // still used ONLY for live preview (dev / current flow)
  const [token, setToken] = useState<string | null>(null);

  const [brand, setBrand] = useState("Aliigo");
  const [locale, setLocale] = useState<"es" | "en">("es");

  const [theme, setTheme] = useState<Theme>({
    headerBg: "bg-gray-900",
    headerText: "text-white",
    bubbleUser: "bg-blue-600 text-white",
    bubbleBot: "bg-gray-100 text-gray-900",
    sendBg: "bg-blue-600",
    sendText: "text-white",
  });

  const [msg, setMsg] = useState<string | null>(null);

  // Load user -> profile+business, then latest token (token only for preview)
  useEffect(() => {
    (async () => {
      setMsg(null);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;
      if (!uid) return;

      const { data, error } = await supabase
        .from("business_profiles")
        .select(
          `
    business_id,
    businesses:businesses!business_profiles_business_id_fkey (
      id,
      slug,
      allowed_domains,
      public_embed_key
    )
  `
        )
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error("[widget] profile join error:", error.message);
        setMsg("Could not load your business.");
        return;
      }
      if (!isWidgetJoinRow(data) || !data.business_id || !data.businesses) {
        setBiz(null);
        return;
      }

      const b = data.businesses;
      if (!b.public_embed_key) {
        setMsg("Missing public_embed_key on businesses row.");
      }

      setBiz({
        id: b.id,
        slug: b.slug,
        allowed_domains: b.allowed_domains ?? [],
        public_embed_key: b.public_embed_key ?? "",
      });

      // Dev preview: grab latest token if it exists (NOT used in embed snippet)
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

  const saveAllowedDomains = async () => {
    setMsg(null);
    if (!biz) return;

    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setMsg("Login required.");
        return;
      }

      const res = await fetch("/api/settings/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          business: {
            allowed_domains: normalizeDomains(biz.allowed_domains),
          },
        }),
      });

      const j: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(j.error || "Save error");
        return;
      }

      setMsg("Saved.");
    } catch (e: unknown) {
      console.error(e);
      setMsg("Could not save now.");
    }
  };

  // Placeholder button for Option A key rotation.
  // Implement this server route later (rotate businesses.public_embed_key).
  const rotatePublicKey = async () => {
    setMsg(
      "TODO: implement /api/widget/rotate-public-key to rotate businesses.public_embed_key."
    );
  };

  const embedCode = useMemo(() => {
    const base = getBaseUrl();
    const themeParam = encodeURIComponent(JSON.stringify(theme));
    const slug = biz?.slug || "your-business";
    const key = biz?.public_embed_key || "PUBLIC_KEY";
    const brandParam = encodeURIComponent(brand);

    // Option A: use a PUBLIC key in the URL, server mints short-lived token.
    // Your /[locale]/chat page will need to accept `key=` and exchange it for a session token.
    return [
      "<!-- Aliigo Chat Widget -->",
      "<script>",
      "(function(){",
      "  var iframe=document.createElement('iframe');",
      `  iframe.src='${base}/${locale}/chat?slug=${slug}&brand=${brandParam}&key=${key}&theme=${themeParam}';`,
      "  iframe.style.position='fixed';",
      "  iframe.style.bottom='24px';",
      "  iframe.style.right='24px';",
      "  iframe.style.width='360px';",
      "  iframe.style.height='420px';",
      "  iframe.style.border='0';",
      "  iframe.style.borderRadius='12px';",
      "  iframe.style.overflow='hidden';",
      "  iframe.style.zIndex='999999';",
      "  document.body.appendChild(iframe);",
      "})();",
      "</script>",
    ].join("\n");
  }, [biz?.slug, biz?.public_embed_key, brand, locale, theme]);

  if (!biz) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We couldn’t find a business associated with your profile. Complete
          your business details in Settings first, then return here.
        </p>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">Widget</h1>

      {msg && <div className="mb-4 text-sm text-zinc-300">{msg}</div>}

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
              value={biz.allowed_domains.join(", ")}
              onChange={(e) =>
                setBiz((b) =>
                  b
                    ? {
                        ...b,
                        allowed_domains: normalizeDomains(
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        ),
                      }
                    : b
                )
              }
            />
            <p className="text-xs text-zinc-500 mt-1">
              Widget requests are accepted only from these hostnames (and
              subdomains).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="bg-white text-black rounded px-4 py-2"
              onClick={saveAllowedDomains}
            >
              Save
            </button>

            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={rotatePublicKey}
            >
              Rotate public key
            </button>
          </div>

          <div className="text-sm text-zinc-400 space-y-1">
            <div>
              Public embed key:{" "}
              <code className="text-zinc-200">
                {biz.public_embed_key || "—"}
              </code>
            </div>
            <div>
              Preview token (dev):{" "}
              <code className="text-zinc-200">{token || "—"}</code>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 pt-2">
            <div>
              <label className="text-sm text-zinc-300">Locale</label>
              <select
                className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={locale}
                onChange={(e) => setLocale(e.target.value as "es" | "en")}
              >
                <option value="es">es</option>
                <option value="en">en</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-300">Brand</label>
              <input
                className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <h2 className="font-semibold mb-2">Live preview</h2>

          <div className="relative h-[420px] border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
            <AliigoChatWidget
              businessSlug={biz.slug}
              brand={brand}
              token={token ?? undefined}
              theme={theme}
            />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <label className="text-sm text-zinc-300">
              Header bg (Tailwind)
            </label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerBg}
              onChange={(e) =>
                setTheme((t) => ({ ...t, headerBg: e.target.value }))
              }
            />

            <label className="text-sm text-zinc-300">Header text</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerText}
              onChange={(e) =>
                setTheme((t) => ({ ...t, headerText: e.target.value }))
              }
            />

            <label className="text-sm text-zinc-300">User bubble</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleUser}
              onChange={(e) =>
                setTheme((t) => ({ ...t, bubbleUser: e.target.value }))
              }
            />

            <label className="text-sm text-zinc-300">Bot bubble</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleBot}
              onChange={(e) =>
                setTheme((t) => ({ ...t, bubbleBot: e.target.value }))
              }
            />

            <label className="text-sm text-zinc-300">Send bg</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendBg}
              onChange={(e) =>
                setTheme((t) => ({ ...t, sendBg: e.target.value }))
              }
            />

            <label className="text-sm text-zinc-300">Send text</label>
            <input
              className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendText}
              onChange={(e) =>
                setTheme((t) => ({ ...t, sendText: e.target.value }))
              }
            />
          </div>
        </section>
      </div>

      {/* Embed snippet */}
      <section className="mt-8">
        <h2 className="font-semibold mb-2">Embed snippet</h2>
        <textarea
          className="w-full border border-zinc-800 bg-zinc-950 text-zinc-200 rounded px-3 py-2 text-xs"
          rows={12}
          value={embedCode}
          readOnly
        />
        <p className="text-xs text-zinc-500 mt-2">
          Paste before the closing <code>&lt;/body&gt;</code> tag of your site.
        </p>

        <p className="text-xs text-zinc-500 mt-2">
          Note: This snippet uses <code>key=</code> (public key). Next step is
          to make
          <code> /[locale]/chat</code> exchange that key for a short-lived
          session token server-side.
        </p>
      </section>
    </div>
  );
}
