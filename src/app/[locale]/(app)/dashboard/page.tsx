// src/app/[locale]/(app)/dashboard/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
// IMPORTANT: Import router from your i18n routing file, not next/navigation
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

// Types
type BusinessRow = {
  id: string | null;
  slug: string | null;
  allowed_domains: string[] | null;
  default_locale: string | null;
  system_prompt: string | null;
  knowledge: string | null;
};

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
  business_id: string | null;
  businesses: BusinessRow | null;
};

type PendingSignup = {
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  createdAtMs: number;
};

const DEFAULT_ALLOWED_DOMAINS = new Set(["aliigo.com", "www.aliigo.com"]);

function nonEmpty(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeDomains(domains: string[] | null | undefined) {
  return (domains ?? [])
    .map((d) =>
      String(d || "")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
}

// “Allowed domains completed” = they added at least one domain beyond aliigo defaults.
function hasNonAliigoDomain(domains: string[] | null | undefined) {
  const d = normalizeDomains(domains);
  return d.some((x) => !DEFAULT_ALLOWED_DOMAINS.has(x));
}

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
  href: string;
};

function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export default function DashboardPage() {
  // 1. Initialize Translations
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const t = useTranslations("Dashboard");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pending, setPending] = useState<PendingSignup | null>(null);

  const [embedToken, setEmbedToken] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 2. Logic (Same as before, just cleaner)
  const daysLeft = useMemo(() => {
    const start = business?.created_at
      ? new Date(business.created_at).getTime()
      : pending?.createdAtMs;

    if (!start) return null;
    const daysPassed = Math.floor((Date.now() - start) / 86_400_000);
    return Math.max(30 - daysPassed, 0);
  }, [business, pending]);

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const raw = localStorage.getItem("aliigo_pending_signup");
          if (raw) {
            setPending(JSON.parse(raw));
            setLoading(false);
            return;
          }
          router.replace("/signup");
          return;
        }

        localStorage.removeItem("aliigo_pending_signup");
        setIsConfirmed(Boolean(session.user.email_confirmed_at));
        setUserEmail(session.user.email ?? null);

        const { data, error } = await supabase
          .from("business_profiles")
          .select(
            `
          id,
          nombre_negocio,
          nombre_contacto,
          telefono,
          created_at,
          business_id,
          businesses:businesses!business_profiles_business_id_fkey (
            id,
            slug,
            allowed_domains,
            default_locale,
            system_prompt,
            knowledge
          )
        `
          )
          .eq("id", session.user.id)
          .maybeSingle<BusinessProfile>();

        if (error) console.error("DB Error:", error.message);

        if (mounted) setBusiness(data ?? null);

        if (data?.business_id) {
          const { data: tok, error: tokErr } = await supabase
            .from("embed_tokens")
            .select("token")
            .eq("business_id", data.business_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!tokErr && tok?.token) setEmbedToken(tok.token);
          else setEmbedToken(null);
        } else {
          setEmbedToken(null);
        }
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        setIsConfirmed(Boolean(session?.user?.email_confirmed_at));
        setUserEmail(session?.user?.email ?? null);
      }
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleResend = async () => {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email || pending?.email;
    if (!email) return;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    // Translation usage in alerts
    if (error) alert(t("resendError", { error: error.message }));
    else alert(t("resendSuccess"));
  };

  const trialExpired = daysLeft !== null && daysLeft <= 0;
  // later you'll replace this with (trialExpired && !isPaid)
  const featuresDisabled = !isConfirmed || trialExpired;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950/60">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600"></div>
        <span className="ml-3 text-gray-500">{t("loading")}</span>
      </div>
    );
  }

  // Helper variables for display
  const displayName = business?.nombre_contacto || pending?.contactName || null;
  const displayBusinessName =
    business?.nombre_negocio ||
    pending?.businessName ||
    t("businessInfo.defaultName");

  const displayEmail = userEmail || pending?.email || "";
  const displayPhone = business?.telefono || pending?.phone || "—";

  const biz = business?.businesses;

  const checklist: { group: string; items: ChecklistItem[] }[] = [
    {
      group: "Business",
      items: [
        {
          id: "allowed_domains",
          label: "Allowed domains configured",
          done: hasNonAliigoDomain(biz?.allowed_domains),
          required: true,
          href: `/${locale}/dashboard/settings/business`,
        },
        {
          id: "default_locale",
          label: "Default language selected",
          done: biz?.default_locale === "en" || biz?.default_locale === "es",
          required: true,
          href: `/${locale}/dashboard/settings/business`,
        },
        {
          id: "contact_name",
          label: "Contact name added",
          done: nonEmpty(business?.nombre_contacto),
          required: false,
          href: `/${locale}/dashboard/settings/business`,
        },
        {
          id: "phone",
          label: "Phone added",
          done: nonEmpty(business?.telefono),
          required: false,
          href: `/${locale}/dashboard/settings/business`,
        },
      ],
    },
    {
      group: "Assistant",
      items: [
        {
          id: "system_prompt",
          label: "System prompt filled",
          done: nonEmpty(biz?.system_prompt),
          required: true,
          href: `/${locale}/dashboard/settings/assistant`,
        },
        {
          id: "knowledge",
          label: "Knowledge filled",
          done: nonEmpty(biz?.knowledge),
          required: true,
          href: `/${locale}/dashboard/settings/assistant`,
        },
      ],
    },
    {
      group: "Widget",
      items: [
        {
          id: "token",
          label: "Token generated",
          done: nonEmpty(embedToken),
          required: true,
          href: `/${locale}/dashboard/widget`,
        },
      ],
    },
  ];

  const flat = checklist.flatMap((g) => g.items);

  const required = flat.filter((x) => x.required);
  const optional = flat.filter((x) => !x.required);

  const requiredDone = required.filter((x) => x.done).length;
  const optionalDone = optional.filter((x) => x.done).length;

  const total = required.length + optional.length;
  const done = requiredDone + optionalDone;

  const completion = pct(done, total);

  const blockers = required.filter((x) => !x.done);

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      {/* HEADER + BUSINESS OVERVIEW + VERIFICATION WARNING (dark UI) */}
      <div className="mb-8">

        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-zinc-100">
            {displayName
              ? t("welcome", { name: displayName })
              : t("welcomeGeneric")}{" "}
            👋
          </h1>

          {daysLeft !== null && (
            <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-300 ring-1 ring-inset ring-brand-500/20">
              {t("trialDays", { days: daysLeft })}
            </span>
          )}
        </div>

        {/* BUSINESS OVERVIEW */}
        <div className="mt-6 overflow-hidden rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-zinc-200">
                  Business overview
                </h2>

                <p className="mt-1 text-sm text-zinc-100 truncate">
                  <span className="font-medium">{displayBusinessName}</span>
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  Contact: {displayName || "—"} · Phone: {displayPhone}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Email: {displayEmail || "—"}
                </p>
              </div>

              <a
                href={`/${locale}/dashboard/settings/business`}
                className="shrink-0 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Edit
              </a>
            </div>
          </div>
        </div>

        {/* VERIFICATION WARNING (muted, not harsh yellow) */}
        {!isConfirmed && (
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-medium text-zinc-100">
                  {t("verifyTitle")}
                </h3>

                <div className="mt-1 text-sm text-zinc-300">
                  <p>{t("verifyMessage", { email: displayEmail ?? "" })}</p>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="rounded-md bg-amber-300/15 px-3 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-inset ring-amber-300/20 hover:bg-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                  >
                    {t("resendButton")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ONBOARDING */}
      <div className="mb-8 overflow-hidden rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-base font-semibold leading-6 text-zinc-100">
                Onboarding
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Complete the required steps to activate your assistant and
                widget.
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-zinc-200">
                {completion}% complete
              </div>
              <div className="mt-2 h-2 w-40 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-2 bg-brand-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Blockers (muted, not harsh red) */}
          {blockers.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
              <div className="text-sm font-medium text-zinc-200">
                Required items missing
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-400">
                {blockers.map((b) => (
                  <li key={b.id}>
                    <a
                      className="text-brand-400 hover:text-brand-300 underline"
                      href={b.href}
                    >
                      {b.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist groups */}
          <div className="mt-5 space-y-4">
            {checklist.map((g) => (
              <div
                key={g.group}
                className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/50">
                  <div className="text-sm font-medium text-zinc-200">
                    {g.group}
                  </div>
                  <a
                    href={g.items[0]?.href}
                    className="text-sm font-medium text-brand-400 hover:text-brand-300"
                  >
                    Open
                  </a>
                </div>

                <ul className="divide-y divide-zinc-800">
                  {g.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* status dot (muted) */}
                        <span
                          className={[
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                            it.done
                              ? "bg-brand-500/10 border-brand-500/20"
                              : it.required
                              ? "bg-amber-500/10 border-amber-500/20"
                              : "bg-zinc-800/40 border-zinc-700/50",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {it.done ? (
                            <span className="text-brand-300 text-xs">✓</span>
                          ) : it.required ? (
                            <span className="text-amber-300 text-xs">!</span>
                          ) : (
                            <span className="text-zinc-400 text-xs">•</span>
                          )}
                        </span>

                        <div className="min-w-0">
                          <div
                            className={[
                              "text-sm truncate",
                              it.required && !it.done
                                ? "text-zinc-200"
                                : "text-zinc-200",
                            ].join(" ")}
                          >
                            {it.label}
                            {it.required && (
                              <span className="ml-2 text-xs text-zinc-500">
                                (required)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      {!it.done ? (
                        <a
                          href={it.href}
                          className={[
                            "text-sm font-medium shrink-0",
                            it.required
                              ? "text-amber-300 hover:text-amber-200"
                              : "text-brand-400 hover:text-brand-300",
                          ].join(" ")}
                        >
                          Fix
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500 shrink-0">
                          Done
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
