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

const isHex = (v?: string) =>
  typeof v === "string" && /^#([0-9a-fA-F]{3}){1,2}$/.test(v.trim());

const normalizeHex = (v: string) => v.trim();

// For strings that contain 1–2 hex values, returns bg + text.
// Example: "#111827 #ffffff" -> { bg:"#111827", text:"#ffffff" }
const splitTwoHex = (v?: string) => {
  const s = (v || "").trim();
  if (!s) return { bg: "", text: "" };

  // Accept partial tokens while typing (no regex)
  const parts = s.split(/\s+/);
  return {
    bg: parts[0] ?? "",
    text: parts[1] ?? "",
  };
};


const [brand, setBrand] = useState("Aliigo");
const [initialBrand, setInitialBrand] = useState("Aliigo");


const joinTwoHex = (bg: string, text: string) =>
  `${normalizeHex(bg)} ${normalizeHex(text)}`.trim();

const DEFAULT_THEME: Theme = {
  headerBg: "#111827 #ffffff", // bg + text
  headerText: "#ffffff", // kept for backwards compat, not used by new UI
  bubbleUser: "#2563eb #ffffff", // bg + text
  bubbleBot: "#f3f4f6 #111827", // bg + text
  sendBg: "#2563eb #ffffff", // bg + text
  sendText: "#ffffff", // kept for backwards compat, not used by new UI
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

type PostgrestErrLike = { message?: string } | null;

function errMsg(e: PostgrestErrLike): string {
  return typeof e?.message === "string" ? e.message : "";
}

// Small helper to keep inputs valid: if empty or invalid, return "" (so user can type)
function safeHex(v: string) {
  const s = v.trim();

  // allow empty so user can clear the field
  if (!s) return "";

  // allow typing partial: "#", "#1", "#12", "#123", "#1234"... etc
  if (s[0] !== "#") return s; // don’t block if they paste without '#', you can enforce later
  const rest = s.slice(1).replace(/[^0-9a-fA-F]/g, "");
  return "#" + rest.slice(0, 6);
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

  useEffect(() => {
    (async () => {
      setMsg(null);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id || null;
      if (!uid) return;

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

      const effectiveBrand = (b.brand_name || b.name || "Aliigo").trim();
      setBrand(effectiveBrand);
      setInitialBrand(effectiveBrand);

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
    const themeDirty = JSON.stringify(theme) !== JSON.stringify(initialTheme);
    const brandDirty = brand.trim() !== initialBrand.trim();
    return themeDirty || brandDirty;
  }, [theme, initialTheme, brand, initialBrand]);

  // ✅ split values for the new UI (no DB change)
  const headerSplit = useMemo(
    () => splitTwoHex(theme.headerBg),
    [theme.headerBg]
  );
  const userSplit = useMemo(
    () => splitTwoHex(theme.bubbleUser),
    [theme.bubbleUser]
  );
  const botSplit = useMemo(
    () => splitTwoHex(theme.bubbleBot),
    [theme.bubbleBot]
  );
  const sendSplit = useMemo(() => splitTwoHex(theme.sendBg), [theme.sendBg]);

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

      if (typeof j.brand_name === "string" && j.brand_name.trim()) {
        const bn = j.brand_name.trim();
        setBrand(bn);
        setInitialBrand(bn);
      } else {
        // If API didn’t echo, still lock in what we saved
        setInitialBrand(brand.trim());
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

    const rotateToken = async () => {
      setMsg(null);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const accessToken = sess.session?.access_token;
        if (!accessToken) {
          setMsg("Login required.");
          return;
        }

        const res = await fetch("/api/widget/rotate-token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const j: { token?: string; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !j.token) {
          setMsg(j.error || "Could not generate token.");
          return;
        }

        setToken(j.token);
        setMsg("Token generated.");
      } catch (e) {
        console.error(e);
        setMsg("Could not generate token.");
      }
    };




  const rotatePublicKey = async () => {
    setMsg(
      "TODO: implement /api/widget/rotate-public-key to rotate businesses.public_embed_key."
    );
  };

  const embedCode = useMemo(() => {
    const base = getBaseUrl();
    const slug = biz?.slug || "your-business";
    const key = biz?.public_embed_key || "PUBLIC_KEY";
    const brandParam = encodeURIComponent(
      (brand || biz?.slug || "Aliigo").trim()
    );
    const locale = biz?.default_locale || "en";
    const themeParam = encodeURIComponent(JSON.stringify(theme));

    return [
      "<!-- Aliigo Widget -->",
      "<script>",
      "(function(){",
      "  try {",
      "    var parentHost = window.location.hostname;",
      "    var iframe = document.createElement('iframe');",
      `    iframe.src='${base}/${locale}/chat?slug=${slug}&brand=${brandParam}&key=${key}&theme=${themeParam}&host=' + encodeURIComponent(parentHost);`,
      "",
      "    // --- HARDENED POSITIONING (works around transforms / weird stacking contexts) ---",
      "    var mount = document.documentElement; // safer than body on some CMS themes",
      "    iframe.style.position = 'fixed';",
      "    iframe.style.bottom = '24px';",
      "    iframe.style.right = '24px';",
      "    iframe.style.width = '180px';",
      "    iframe.style.height = '56px';",
      "    iframe.style.border = '0';",
      "    iframe.style.borderRadius = '9999px';",
      "    iframe.style.overflow = 'hidden';",
      "    iframe.style.background = 'transparent';",
      "    iframe.style.zIndex = '2147483647'; // max-ish z-index to beat sticky headers",
      "    iframe.style.pointerEvents = 'auto';",
      "    iframe.style.display = 'block';",
      "",
      "    // iOS safe-area support (prevents bottom UI overlap)",
      "    iframe.style.bottom = 'calc(24px + env(safe-area-inset-bottom, 0px))';",
      "    iframe.style.right  = 'calc(24px + env(safe-area-inset-right,  0px))';",
      "",
      "    iframe.setAttribute('title','Aliigo Widget');",
      "    iframe.setAttribute('scrolling','no');",
      "    iframe.setAttribute('allow','clipboard-write');",
      "",
      "    // Create a fixed-position wrapper to avoid parent CSS quirks on some sites",
      "    var wrap = document.createElement('div');",
      "    wrap.style.position = 'fixed';",
      "    wrap.style.bottom = '0';",
      "    wrap.style.right = '0';",
      "    wrap.style.zIndex = '2147483647';",
      "    wrap.style.pointerEvents = 'none'; // iframe will re-enable pointer events",
      "    wrap.appendChild(iframe);",
      "",
      "    // ensure iframe can be clicked",
      "    iframe.style.pointerEvents = 'auto';",
      "",
      "    mount.appendChild(wrap);",
      "",
      "    window.addEventListener('message', function(ev){",
      "      try {",
      "        var d = ev.data;",
      "        if (!d || d.type !== 'ALIIGO_WIDGET_SIZE') return;",
      "        if (typeof d.w === 'number') iframe.style.width = d.w + 'px';",
      "        if (typeof d.h === 'number') iframe.style.height = d.h + 'px';",
      "        if (typeof d.radius === 'string') iframe.style.borderRadius = d.radius;",
      "      } catch(e) {}",
      "    });",
      "  } catch(e) {}",
      "})();",
      "</script>",
    ].join("\n");
  }, [biz?.slug, biz?.public_embed_key, biz?.default_locale, brand, theme]);

  if (!biz) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">No linked business</h1>
        <p className="text-sm text-zinc-400">
          We couldn’t find a business associated with your profile. Complete
          Settings → Business first, then return here.
        </p>
        {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl text-white">
      <h1 className="text-2xl font-bold mb-4">Widget</h1>

      {msg && (
        <div
          className={`mb-4 text-sm ${
            msg === "Saved." ? "text-green-400" : "text-zinc-300"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Preview + Theme */}
        <section className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40 space-y-4">
          <h2 className="font-semibold">Live preview</h2>

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

          {/* HEX inputs (bg + text) */}
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">Header</div>
              <div className="text-xs text-zinc-500 sm:text-right">
                bg / text
              </div>

              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={headerSplit.bg}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const bg = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    headerBg: joinTwoHex(bg, headerSplit.text || "#ffffff"),
                  }));
                }}
              />
              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={headerSplit.text}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const text = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    headerBg: joinTwoHex(headerSplit.bg || "#111827", text),
                  }));
                }}
              />
            </div>

            {/* User bubble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                User bubble
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                bg / text
              </div>

              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={userSplit.bg}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const bg = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    bubbleUser: joinTwoHex(bg, userSplit.text || "#ffffff"),
                  }));
                }}
              />
              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={userSplit.text}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const text = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    bubbleUser: joinTwoHex(userSplit.bg || "#2563eb", text),
                  }));
                }}
              />
            </div>

            {/* Bot bubble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                Bot bubble
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                bg / text
              </div>

              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={botSplit.bg}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const bg = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    bubbleBot: joinTwoHex(bg, botSplit.text || "#111827"),
                  }));
                }}
              />
              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={botSplit.text}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const text = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    bubbleBot: joinTwoHex(botSplit.bg || "#f3f4f6", text),
                  }));
                }}
              />
            </div>

            {/* Send button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-sm text-zinc-300 font-medium">
                Send button
              </div>
              <div className="text-xs text-zinc-500 sm:text-right">
                bg / text
              </div>

              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={sendSplit.bg}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const bg = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    sendBg: joinTwoHex(bg, sendSplit.text || "#ffffff"),
                  }));
                }}
              />
              <input
                className="border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
                value={sendSplit.text}
                placeholder="#RRGGBB"
                onChange={(e) => {
                  const text = safeHex(e.target.value);
                  setTheme((t) => ({
                    ...t,
                    sendBg: joinTwoHex(sendSplit.bg || "#2563eb", text),
                  }));
                }}
              />
            </div>
          </div>
        </section>

        {/* RIGHT: Keys + actions */}
        <section className="space-y-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 space-y-1">
            <div>
              Business slug: <code className="text-zinc-200">{biz.slug}</code>
            </div>
            <div>
              Default language:{" "}
              <code className="text-zinc-200">{biz.default_locale}</code>
            </div>
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

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Brand</label>
            <input
              className="w-full border border-zinc-800 bg-zinc-950 text-white rounded px-3 py-2 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="bg-white text-black rounded px-4 py-2 disabled:opacity-50"
              onClick={saveTheme}
              disabled={!dirty || saving}
            >
              {saving ? "Saving…" : "Save theme"}
            </button>

            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900 disabled:opacity-50"
              onClick={() => {
                setTheme(initialTheme);
                setBrand(initialBrand);
                setMsg(null);
              }}
              disabled={!dirty || saving}
            >
              Reset
            </button>
            
            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={rotateToken}
            >
              Generate token
            </button>

            <button
              className="border border-zinc-700 rounded px-4 py-2 hover:bg-zinc-900"
              onClick={rotatePublicKey}
            >
              Rotate public key
            </button>
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
