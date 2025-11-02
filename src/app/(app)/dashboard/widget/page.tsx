"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";
import type { BusinessProfileRow, BusinessRow } from "@/types/tables";

type Theme = {
  headerBg?: string; headerText?: string; bubbleUser?: string; bubbleBot?: string;
  inputBg?: string; sendBg?: string; sendText?: string; border?: string;
};

export default function WidgetPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // ⬇️ Give biz a real type, no more any
  const [biz, setBiz] = useState<Pick<BusinessRow, "id" | "slug" | "system_prompt" | "allowed_domains"> | null>(null);

  const [theme, setTheme] = useState<Theme>({
    headerBg: "bg-black",
    headerText: "text-white",
    bubbleUser: "bg-black text-white",
    bubbleBot: "bg-gray-100 text-gray-900",
    inputBg: "bg-white",
    sendBg: "bg-black",
    sendText: "text-white",
    border: "border-gray-300",
  });
  const [token, setToken] = useState<string | null>(null);
  const [brand, setBrand] = useState("Aliigo");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id || null;
      setUserId(uid);
      if (!uid) return;

      // ⬇️ Typed select on business_profiles
      const { data: prof, error: profErr } = await supabase
        .from<BusinessProfileRow>("business_profiles")
        .select("business_id")
        .eq("id", uid)
        .single();

      if (!profErr && prof?.business_id) {
        // ⬇️ Typed select on businesses
        const { data: b, error: bErr } = await supabase
          .from<BusinessRow>("businesses")
          .select("id,slug,system_prompt,allowed_domains")
          .eq("id", prof.business_id)
          .single();

        if (!bErr && b) {
          // normalize allowed_domains to [] for UI convenience
          setBiz({
            id: b.id,
            slug: b.slug,
            system_prompt: b.system_prompt,
            allowed_domains: b.allowed_domains ?? [],
          });
        }
      }

      // ⬇️ Get latest token (optional table may be empty)
      if (prof?.business_id) {
        const { data: t } = await supabase
          .from<EmbedTokenRow>("embed_tokens")
          .select("token")
          .eq("business_id", prof.business_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (t?.token) setToken(t.token);
      }
    })();
  }, []);
  const saveSettings = async () => {
    await fetch("/api/widget/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, system_prompt: biz?.system_prompt || "", allowed_domains: biz?.allowed_domains || []
      }),
    });
    alert("Widget settings saved.");
  };

  const rotateToken = async () => {
    const res = await fetch("/api/widget/rotate-token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const j = await res.json();
    if (res.ok) setToken(j.token);
    else alert(j.error || "Error");
  };

  const embedCode = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://aliigo.vercel.app";
    const themeParam = encodeURIComponent(JSON.stringify(theme));
    const slug = biz?.slug || "horchata-labs";
    const tk = token || "SET_TOKEN";
    return [
      "<!-- Aliigo Chat Widget -->",
      "<script>",
      "(function(){",
      `  var iframe=document.createElement('iframe');`,
      `  iframe.src='${base}/embed/chat?slug=${slug}&brand=${encodeURIComponent(brand)}&token=${tk}&theme=${themeParam}';`,
      `  iframe.style.position='fixed';`,
      `  iframe.style.bottom='24px';`,
      `  iframe.style.right='24px';`,
      `  iframe.style.width='360px';`,
      `  iframe.style.height='420px';`,
      `  iframe.style.border='0';`,
      `  iframe.style.zIndex='999999';`,
      `  document.body.appendChild(iframe);`,
      "})();",
      "</script>",
    ].join("\n");
  }, [biz?.slug, brand, theme, token]);

  if (!biz) return <p>Cargando…</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Widget</h1>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Allowed domains</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="example.com, store.example.com"
              value={biz.allowed_domains?.join(", ") || ""}
              onChange={(e) =>
                setBiz((b) => b ? { ...b, allowed_domains: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) } : b)
              }
            />
            <p className="text-xs text-gray-500 mt-1">Domains allowed to embed your widget.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assistant instructions</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={6}
              value={biz.system_prompt || ""}
              onChange={(e) => setBiz(b => b ? { ...b, system_prompt: e.target.value } : b)}
            />
          </div>

          <div className="flex gap-2">
            <button className="bg-black text-white rounded px-4 py-2" onClick={saveSettings}>Save</button>
            <button className="border rounded px-4 py-2" onClick={rotateToken}>Rotate token</button>
          </div>

          <div className="text-sm text-gray-600">
            Current token: <code>{token || "—"}</code>
          </div>
        </section>

        {/* Live Preview */}
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Live preview</h2>
          <div className="relative h-[420px] border rounded">
            <AliigoChatWidget
              businessSlug={biz.slug}
              brand={brand}
              theme={theme}
            />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <label className="text-sm">Brand</label>
            <input className="border rounded px-3 py-2" value={brand} onChange={e => setBrand(e.target.value)} />

            <label className="text-sm">Header bg (Tailwind)</label>
            <input className="border rounded px-3 py-2" value={theme.headerBg} onChange={e=>setTheme(t=>({ ...t, headerBg: e.target.value }))} />

            <label className="text-sm">Header text</label>
            <input className="border rounded px-3 py-2" value={theme.headerText} onChange={e=>setTheme(t=>({ ...t, headerText: e.target.value }))} />

            <label className="text-sm">User bubble</label>
            <input className="border rounded px-3 py-2" value={theme.bubbleUser} onChange={e=>setTheme(t=>({ ...t, bubbleUser: e.target.value }))} />

            <label className="text-sm">Bot bubble</label>
            <input className="border rounded px-3 py-2" value={theme.bubbleBot} onChange={e=>setTheme(t=>({ ...t, bubbleBot: e.target.value }))} />

            <label className="text-sm">Send bg</label>
            <input className="border rounded px-3 py-2" value={theme.sendBg} onChange={e=>setTheme(t=>({ ...t, sendBg: e.target.value }))} />

            <label className="text-sm">Send text</label>
            <input className="border rounded px-3 py-2" value={theme.sendText} onChange={e=>setTheme(t=>({ ...t, sendText: e.target.value }))} />
          </div>
        </section>
      </div>

      {/* Embed snippet */}
      <section className="mt-8">
        <h2 className="font-semibold mb-2">Embed snippet</h2>
        <textarea className="w-full border rounded px-3 py-2 text-xs" rows={10} value={embedCode} readOnly />
        <p className="text-xs text-gray-500 mt-2">Paste on your site (before </p>
      </section>
    </div>
  );
}
