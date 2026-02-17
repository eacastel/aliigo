"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import { useBillingGate } from "@/components/BillingGateContext";

type BizJoinRow = {
  business_id: string | null;
  businesses: {
    id: string;
    slug: string;
    public_embed_key: string | null;
  } | null;
};

const btnBase =
  "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors !cursor-pointer disabled:opacity-60 disabled:!cursor-not-allowed";
const btnBrand = `${btnBase} bg-brand-500/10 text-brand-200 ring-brand-500/25 hover:bg-brand-500/15`;
const btnNeutral = `${btnBase} bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40`;
const btnNeutralStrong = `${btnBase} bg-zinc-950/40 text-zinc-200 ring-zinc-700/60 hover:bg-zinc-900/50`;

export default function WidgetAdvancedPage() {
  const t = useTranslations("DashboardWidget");
  const billingGate = useBillingGate();
  const widgetLocked = billingGate.status === "inactive";
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [publicEmbedKey, setPublicEmbedKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotatingToken, setRotatingToken] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);

  useEffect(() => {
    (async () => {
      setMsg(null);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user?.id || null;
        if (!uid) {
          setMsg(t("messages.loginRequired"));
          return;
        }

        const r1 = await supabase
          .from("business_profiles")
          .select(
            `
            business_id,
            businesses:businesses!business_profiles_business_id_fkey (
              id,
              slug,
              public_embed_key
            )
          `
          )
          .eq("id", uid)
          .maybeSingle<BizJoinRow>();

        if (r1.error) {
          setMsg(t("messages.loadBusinessError"));
          return;
        }
        if (!r1.data?.business_id || !r1.data.businesses) {
          setBusinessId(null);
          return;
        }

        setBusinessId(r1.data.business_id);
        setSlug(r1.data.businesses.slug);
        setPublicEmbedKey(r1.data.businesses.public_embed_key);

        const tokenRes = await supabase
          .from("embed_tokens")
          .select("token")
          .eq("business_id", r1.data.business_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!tokenRes.error && tokenRes.data?.token) {
          setToken(tokenRes.data.token);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const rotateToken = async () => {
    setMsg(null);
    setRotatingToken(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setMsg(t("messages.loginRequired"));
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
        setMsg(j.error || t("messages.generateTokenError"));
        return;
      }
      setToken(j.token);
      setMsg(t("messages.tokenGenerated"));
    } catch {
      setMsg(t("messages.generateTokenError"));
    } finally {
      setRotatingToken(false);
    }
  };

  const rotatePublicKey = async () => {
    setMsg(null);
    setRotatingKey(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setMsg(t("messages.loginRequired"));
        return;
      }

      const res = await fetch("/api/widget/rotate-public-key", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const j: { publicEmbedKey?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !j.publicEmbedKey) {
        setMsg(j.error || t("messages.rotatePublicKeyError"));
        return;
      }

      setPublicEmbedKey(j.publicEmbedKey);
      setMsg(t("messages.rotatePublicKeySuccess"));
    } catch {
      setMsg(t("messages.rotatePublicKeyError"));
    } finally {
      setRotatingKey(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl text-zinc-300">{t("loadingPreview")}</div>;
  }

  if (!businessId) {
    return (
      <div className="max-w-lg p-4 text-white">
        <h1 className="text-xl font-semibold mb-2">{t("noLinkedBusiness.title")}</h1>
        <p className="text-sm text-zinc-400">{t("noLinkedBusiness.body")}</p>
        {msg ? <p className="mt-3 text-sm text-red-400">{msg}</p> : null}
      </div>
    );
  }

  return (
    <main className="max-w-5xl text-white space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("advanced.title")}</h1>
        <Link href="/dashboard/widget" className={btnNeutral}>
          {t("advanced.backToWidget")}
        </Link>
      </div>

      <p className="text-sm text-zinc-400">{t("advanced.subtitle")}</p>

      {msg ? (
        <div className={`text-sm ${msg === t("messages.tokenGenerated") ? "text-green-400" : "text-zinc-300"}`}>
          {msg}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-sm">
        <div>
          {t("businessSlug")}: <code className="text-zinc-200">{slug || t("emptyDash")}</code>
        </div>
        <div>
          {t("publicEmbedKey")}: <code className="text-zinc-200">{publicEmbedKey || t("emptyDash")}</code>
        </div>
        <div>
          {t("previewToken")}: <code className="text-zinc-200">{token || t("emptyDash")}</code>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <h2 className="font-semibold">{t("advanced.generateTokenTitle")}</h2>
        <p className="text-sm text-zinc-400">{t("advanced.generateTokenDesc")}</p>
        <button className={btnBrand} onClick={rotateToken} disabled={widgetLocked || rotatingToken}>
          {rotatingToken ? t("buttons.saving") : t("buttons.generateToken")}
        </button>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <h2 className="font-semibold">{t("advanced.rotatePublicKeyTitle")}</h2>
        <p className="text-sm text-zinc-400">{t("advanced.rotatePublicKeyDesc")}</p>
        <button className={btnNeutralStrong} onClick={rotatePublicKey} disabled={widgetLocked || rotatingKey}>
          {rotatingKey ? t("buttons.saving") : t("buttons.rotatePublicKey")}
        </button>
      </section>
    </main>
  );
}
