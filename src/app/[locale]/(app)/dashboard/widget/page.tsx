// src/app/(app)/dashboard/widget/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";

type Theme = {
  headerBg: string;
  headerText: string;
  bubbleUser: string;
  bubbleBot: string;
  sendBg: string;
  sendText: string;
};

type ThemeDb = Partial<Theme>;

type BizLocal = {
  id: string;
  slug: string;
  public_embed_key: string;
  default_locale: "en" | "es";
  widget_theme: ThemeDb;
};

type WidgetJoinRow = {
  business_id: string | null;
  businesses: {
    id: string;
    slug: string;
    public_embed_key: string | null;
    default_locale: string | null;
    widget_theme: ThemeDb | null;
  } | null;
};

function isWidgetJoinRow(x: unknown): x is WidgetJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "business_id" in o && "businesses" in o;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.com";
}

const DEFAULT_THEME: Theme = {
  headerBg: "bg-gray-900",
  headerText: "text-white",
  bubbleUser: "bg-blue-600 text-white",
  bubbleBot: "bg-gray-100 text-gray-900",
  sendBg: "bg-blue-600",
  sendText: "text-white",
};

function mergeTheme(db: ThemeDb | null | undefined): Theme {
  return { ...DEFAULT_THEME, ...(db ?? {}) };
}

function toThemeDb(x: unknown): ThemeDb | undefined {
  if (!x || typeof x !== "object") return undefined;

  const o = x as Record<string, unknown>;
  const out: ThemeDb = {};

  if (typeof o.headerBg === "string") out.headerBg = o.headerBg;
  if (typeof o.headerText === "string") out.headerText = o.headerText;
  if (typeof o.bubbleUser === "string") out.bubbleUser = o.bubbleUser;
  if (typeof o.bubbleBot === "string") out.bubbleBot = o.bubbleBot;
  if (typeof o.sendBg === "string") out.sendBg = o.sendBg;
  if (typeof o.sendText === "string") out.sendText = o.sendText;

  return out;
}

export default function WidgetSettingsPage() {
  const [biz, setBiz] = useState<BizLocal | null>(null);

  // dev-only convenience token (preview)
  const [token, setToken] = useState<string | null>(null);

  const [brand, setBrand] = useState("Aliigo");

  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [initialTheme, setInitialTheme] = useState<Theme>(DEFAULT_THEME);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  type BizRow = {
    id: string;
    slug: string;
    name: string | null;
    brand_name: string | null;
    public_embed_key: string | null;
    default_locale: string | null;
    widget_theme?: unknown; 
  };

  type JoinRow = {
    business_id: string | null;
    businesses: BizRow | null;
  };

  type PostgrestErrLike = { message?: string } | null;

  function errMsg(e: PostgrestErrLike): string {
    return typeof e?.message === "string" ? e.message : "";
  }


  useEffect(() => {
  (async () => {
    setMsg(null);

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id || null;
    if (!uid) return;

    // TRY 1: includes widget_theme
    const r1 = await supabase
      .from("business_profiles")
      .select(
        `
        business_id,
        businesses:businesses!business_profiles_business_id_fkey (
          id,
          name,
          brand_name,
          slug,
          public_embed_key,
          default_locale,
          widget_theme
        )
      `
      )
      .eq("id", uid)
      .maybeSingle<JoinRow>();

    let data: JoinRow | null = r1.data ?? null;
    let error: PostgrestErrLike = r1.error;

    // FALLBACK: retry without widget_theme if column doesn't exist
    if (/widget_theme.*does not exist/i.test(errMsg(error))) {
      const r2 = await supabase
        .from("business_profiles")
        .select(
          `
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            slug,
            name,
            brand_name,
            public_embed_key,
            default_locale
          )
        `
        )
        .eq("id", uid)
        .maybeSingle<JoinRow>();

      data = r2.data ?? null;
      error = r2.error;
    }

    if (error) {
      console.error("[widget] profile join error:", errMsg(error));
      setMsg("Could not load your business.");
      return;
    }

    if (!data?.business_id || !data.businesses) {
      setBiz(null);
      return;
    }

    const b = data.businesses;

    const effectiveBrand = (b.brand_name || b.name || "Aliigo").trim(); setBrand(effectiveBrand);

    const dbTheme = toThemeDb(b.widget_theme);
    const merged = mergeTheme(dbTheme);

      setBiz({
        id: b.id,
        slug: b.slug,
        public_embed_key: b.public_embed_key ?? "",
        default_locale: b.default_locale === "es" ? "es" : "en",
        widget_theme: dbTheme ?? {},
      });

      setTheme(merged);
      setInitialTheme(merged);

      // dev preview token (optional)
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

  const dirty = useMemo(() => {
    return JSON.stringify(theme) !== JSON.stringify(initialTheme);
  }, [theme, initialTheme]);

  const saveTheme = async () => {
    setMsg(null);
    setSaving(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setMsg("Login required.");
        return;
      }

      const res = await fetch("/api/widget/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          widget_theme: theme,
          brand_name: brand,
        }),
      });

      const j: {
        ok?: boolean;
        error?: string;
        theme?: ThemeDb;
        brand_name?: string | null;
      } = await res.json().catch(() => ({}));

      if (!res.ok || !j.ok) {
        setMsg(j.error || "Save error");
        return;
      }

      // ✅ sync brand from server (authoritative)
      if (typeof j.brand_name === "string" && j.brand_name.trim()) {
        setBrand(j.brand_name.trim());
      }
        
      const merged = mergeTheme(j.theme ?? theme);
      setTheme(merged);
      setInitialTheme(merged);
      setMsg("Saved.");
    } catch (e: unknown) {
      console.error(e);
      setMsg("Could not save now.");
    } finally {
      setSaving(false);
    }
  };

  const rotatePublicKey = async () => {
    setMsg("TODO: implement /api/widget/rotate-public-key to rotate businesses.public_embed_key.");
  };

  const embedCode = useMemo(() => {
    const base = getBaseUrl();
    const slug = biz?.slug || "your-business";
    const key = biz?.public_embed_key || "PUBLIC_KEY";
    const brandParam = encodeURIComponent((brand || biz?.slug || "Aliigo").trim());
    const locale = biz?.default_locale || "en";

    // keep theme in URL for now (still useful as override),
    // but now the page will load the stored theme as the default.
    const themeParam = encodeURIComponent(JSON.stringify(theme));

    return [
      "<!-- Aliigo Widget -->",
      "<script>",
      "(function(){",
      "  var parentHost = window.location.hostname;",
      "  var iframe = document.createElement('iframe');",
      `  iframe.src='${base}/${locale}/chat?slug=${slug}&brand=${brandParam}&key=${key}&theme=${themeParam}&host=' + encodeURIComponent(parentHost);`,
      "  iframe.style.position='fixed';",
      "  iframe.style.bottom='24px';",
      "  iframe.style.right='24px';",
      "  iframe.style.width='180px';",
      "  iframe.style.height='56px';",
      "  iframe.style.border='0';",
      "  iframe.style.borderRadius='9999px';",
      "  iframe.style.overflow='hidden';",
      "  iframe.style.background='transparent';",
      "  iframe.style.zIndex='999999';",
      "  iframe.setAttribute('title','Aliigo Widget');",
      "  iframe.setAttribute('scrolling','no');",
      "  document.body.appendChild(iframe);",
      "",
      "  window.addEventListener('message', function(ev){",
      "    try {",
      "      var d = ev.data;",
      "      if (!d || d.type !== 'ALIIGO_WIDGET_SIZE') return;",
      "      if (typeof d.w === 'number') iframe.style.width = d.w + 'px';",
      "      if (typeof d.h === 'number') iframe.style.height = d.h + 'px';",
      "      if (typeof d.radius === 'string') iframe.style.borderRadius = d.radius;",
      "    } catch(e) {}",
      "  });",
      "})();",
      "</script>",
    ].join("\n");
  }, [biz?.slug, biz?.public_embed_key, biz?.default_locale, brand, theme]);

  if (!biz) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We couldn’t find a business associated with your profile. Complete Settings → Business first, then return here.
        </p>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">Widget</h1>

      {msg && (
        <div className={`mb-4 text-sm ${msg === "Saved." ? "text-green-400" : "text-zinc-300"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 space-y-1">
            <div>Business slug: <code className="text-zinc-200">{biz.slug}</code></div>
            <div>Default language: <code className="text-zinc-200">{biz.default_locale}</code></div>
            <div>Public embed key: <code className="text-zinc-200">{biz.public_embed_key || "—"}</code></div>
            <div>Preview token (dev): <code className="text-zinc-200">{token || "—"}</code></div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Brand</label>
            <input
              className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="bg-white text-black rounded px-4 py-2 disabled:opacity-50"
              onClick={saveTheme}
              disabled={!dirty || saving}
            >
              {saving ? "Saving…" : "Save theme"}
            </button>

            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={() => {
                setTheme(initialTheme);
                setMsg(null);
              }}
              disabled={!dirty || saving}
            >
              Reset
            </button>

            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={rotatePublicKey}
            >
              Rotate public key
            </button>
          </div>
        </section>

        <section className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40">
          <h2 className="font-semibold mb-2">Live preview</h2>

          <div className="relative h-[420px] border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
            <AliigoChatWidget
              preview
              businessSlug={biz.slug}
              brand={brand}
              token={token ?? undefined}
              theme={theme}
              parentHost=""
              channel="web"
              locale={biz.default_locale}
            />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <label className="text-sm text-zinc-300">Header bg</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerBg}
              onChange={(e) => setTheme((t) => ({ ...t, headerBg: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Header text</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.headerText}
              onChange={(e) => setTheme((t) => ({ ...t, headerText: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">User bubble</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleUser}
              onChange={(e) => setTheme((t) => ({ ...t, bubbleUser: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Bot bubble</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.bubbleBot}
              onChange={(e) => setTheme((t) => ({ ...t, bubbleBot: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Send bg</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendBg}
              onChange={(e) => setTheme((t) => ({ ...t, sendBg: e.target.value }))}
            />

            <label className="text-sm text-zinc-300">Send text</label>
            <input className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={theme.sendText}
              onChange={(e) => setTheme((t) => ({ ...t, sendText: e.target.value }))}
            />
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold mb-2">Embed snippet</h2>
        <textarea
          className="w-full border border-zinc-800 bg-zinc-950 text-zinc-200 rounded px-3 py-2 text-xs"
          rows={14}
          value={embedCode}
          readOnly
        />
      </section>
    </div>
  );
}
