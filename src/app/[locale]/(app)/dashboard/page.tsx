// src/app/[locale]/(app)/dashboard/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";
import { useTranslations, useLocale } from "next-intl";

// Types
type BusinessRow = {
  id: string | null;
  slug: string | null;
  allowed_domains: string[] | null;
  default_locale: string | null;
  system_prompt: string | null;
  qualification_prompt: string | null; // ✅ make it consistent
  knowledge: string | null;
  widget_theme: Record<string, unknown> | null;
  widget_header_logo_path: string | null;
  billing_plan: string | null;
  billing_status: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
  trial_end: string | null;
};

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string | null;
  email_verified_at: string | null;
  email_verification_deadline: string | null;
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

type UsagePayload = {
  status: "incomplete" | "trialing" | "active" | "canceled" | "past_due";
  plan: "basic" | "growth" | "pro" | "custom" | "starter" | null;
  used: number;
  limit: number | null;
  remaining: number | null;
  period_start: string;
  period_end: string;
};

const DEFAULT_ALLOWED_DOMAINS = new Set(["aliigo.com", "www.aliigo.com"]);

function nonEmpty(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeDomains(domains: string[] | null | undefined) {
  return (domains ?? [])
    .map((d) => String(d || "").trim().toLowerCase())
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
  href: DashboardRoute;
};

type DashboardRoute =
  | "/dashboard/settings/business"
  | "/dashboard/settings/assistant"
  | "/dashboard/widget";

function pct(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [pending, setPending] = useState<PendingSignup | null>(null);

  const [embedToken, setEmbedToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);

  const daysLeft = useMemo(() => {
    const billing = business?.businesses;
    if (billing?.billing_status === "trialing" && billing.trial_end) {
      const endMs = Date.parse(billing.trial_end);
      if (Number.isFinite(endMs)) {
        const msLeft = endMs - Date.now();
        return msLeft > 0 ? Math.ceil(msLeft / 86_400_000) : 0;
      }
    }

    const start = pending?.createdAtMs ?? null;
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
        setUserEmail(session.user.email ?? null);

        const { data, error } = await supabase
          .from("business_profiles")
          .select(
            `
            id,
            nombre_negocio,
            nombre_contacto,
            telefono,
            email,
            created_at,
            email_verified_at,
            email_verification_deadline,
            business_id,
            businesses:businesses!business_profiles_business_id_fkey (
              id,
              slug,
              allowed_domains,
              default_locale,
              system_prompt,
              qualification_prompt,
              knowledge,
              widget_theme,
              widget_header_logo_path,
              billing_plan,
              billing_status,
              trial_end
            )
          `
          )
          .eq("id", session.user.id)
          .maybeSingle<BusinessProfile>();

        if (error) console.error("DB Error:", error.message);
        if (mounted) {
          setBusiness(data ?? null);
          setIsVerified(Boolean(data?.email_verified_at));
        }

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

        const token = session.access_token;
        const usageRes = await fetch("/api/billing/usage", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const usageJson = (await usageRes.json().catch(() => ({}))) as Partial<UsagePayload>;
        if (usageRes.ok && usageJson.used !== undefined) {
          setUsage({
            status: usageJson.status ?? "incomplete",
            plan: usageJson.plan ?? null,
            used: usageJson.used ?? 0,
            limit: usageJson.limit ?? null,
            remaining: usageJson.remaining ?? null,
            period_start: usageJson.period_start ?? "",
            period_end: usageJson.period_end ?? "",
          });
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

  const trialExpired = daysLeft !== null && daysLeft <= 0;
  const featuresDisabled = !isVerified || trialExpired;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950/60">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600"></div>
        <span className="ml-3 text-gray-500">{t("loading")}</span>
      </div>
    );
  }

  const displayName = business?.nombre_contacto || pending?.contactName || null;
  const displayBusinessName =
    business?.nombre_negocio || pending?.businessName || t("businessInfo.defaultName");

  const displayEmail = userEmail || pending?.email || "";
  const displayPhone = business?.telefono || pending?.phone || "—";

  const biz = business?.businesses;
  const usagePct =
    usage?.limit && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const usageFmt = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const usagePeriodEnd = usage?.period_end ? usageFmt.format(new Date(usage.period_end)) : "—";
  const usageStatusLabel =
    usage?.status ? t(`usage.status.${usage.status}` as const) : t("usage.status.incomplete");
  const usagePlanLabel = usage?.plan ? t(`usage.plan.${usage.plan}` as const) : null;
  const usageLimitLabel =
    usage?.limit === null ? (usage?.status === "incomplete" ? "—" : "∞") : String(usage?.limit ?? 0);

  const checklist: { group: string; items: ChecklistItem[] }[] = [
    {
      group: t("groups.business"),
      items: [
        {
          id: "allowed_domains",
          label: t("items.allowed_domains"),
          done: hasNonAliigoDomain(biz?.allowed_domains),
          required: true,
          href: "/dashboard/settings/business",
        },
        {
          id: "default_locale",
          label: t("items.default_locale"),
          done: biz?.default_locale === "en" || biz?.default_locale === "es",
          required: true,
          href: "/dashboard/settings/business",
        },
        {
          id: "contact_name",
          label: t("items.contact_name"),
          done: nonEmpty(business?.nombre_contacto),
          required: false,
          href: "/dashboard/settings/business",
        },
        {
          id: "phone",
          label: t("items.phone"),
          done: nonEmpty(business?.telefono),
          required: false,
          href: "/dashboard/settings/business",
        },
      ],
    },
    {
      group: t("groups.assistant"),
      items: [
        {
          id: "system_prompt",
          label: t("items.system_prompt"),
          done: nonEmpty(biz?.system_prompt),
          required: true,
          href: "/dashboard/settings/assistant",
        },
        {
          id: "qualification_prompt",
          label: t("items.qualification_prompt"),
          done: nonEmpty(biz?.qualification_prompt),
          required: true,
          href: "/dashboard/settings/assistant",
        },
        {
          id: "knowledge",
          label: t("items.knowledge"),
          done: nonEmpty(biz?.knowledge),
          required: true,
          href: "/dashboard/settings/assistant",
        },
      ],
    },
    {
      group: t("groups.widget"),
      items: [
        {
          id: "widget_personalized",
          label: t("items.widget_personalized"),
          done: !!(biz?.widget_theme && Object.keys(biz.widget_theme).length > 0),
          required: false,
          href: "/dashboard/widget",
        },
        {
          id: "widget_colors",
          label: t("items.widget_colors"),
          done: !!(
            biz?.widget_theme &&
            typeof biz.widget_theme === "object" &&
            (nonEmpty(String((biz.widget_theme as Record<string, unknown>).headerBg ?? "")) ||
              nonEmpty(String((biz.widget_theme as Record<string, unknown>).userBg ?? "")) ||
              nonEmpty(String((biz.widget_theme as Record<string, unknown>).assistantBg ?? "")) ||
              nonEmpty(String((biz.widget_theme as Record<string, unknown>).sendBg ?? "")))
          ),
          required: false,
          href: "/dashboard/widget",
        },
        {
          id: "header_logo",
          label: t("items.header_logo"),
          done: nonEmpty(biz?.widget_header_logo_path),
          required: false,
          href: "/dashboard/widget",
        },
      ],
    },
  ];

  const flat = checklist.flatMap((g) => g.items);
  const required = flat.filter((x) => x.required);
  const optional = flat.filter((x) => !x.required);

  const requiredDone = required.filter((x) => x.done).length;
  const total = required.length;
  const done = requiredDone;

  const completion = pct(done, total);
  const blockers = required.filter((x) => !x.done);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-zinc-100">
            {displayName ? t("welcome", { name: displayName }) : t("welcomeGeneric")}{" "}
          </h1>

          {daysLeft !== null && (
            <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-300 ring-1 ring-inset ring-brand-500/20">
              {t("trialDays", { days: daysLeft })}
            </span>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-zinc-200">
                  {t("businessOverview.title")}
                </h2>

                <p className="mt-1 text-sm text-zinc-100 truncate">
                  <span className="font-medium">{displayBusinessName}</span>
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  {t("businessOverview.contactLine", {
                    name: displayName || "—",
                    phone: displayPhone,
                  })}
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  {t("businessOverview.emailLine", { email: displayEmail || "—" })}
                </p>
              </div>

              <Link
                href="/dashboard/settings/business"
                className="shrink-0 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                {t("businessOverview.edit")}
              </Link>
            </div>
          </div>
        </div>

        {usage && (
          <div className="mt-6 overflow-hidden rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-zinc-200">{t("usage.title")}</h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t("usage.resetsOn", { date: usagePeriodEnd })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-100">
                    {usage.used}
                    {` / ${usageLimitLabel}`}
                  </div>
                  <div className="text-xs text-zinc-400 capitalize">
                    {usagePlanLabel
                      ? t("usage.planLabel", { plan: usagePlanLabel })
                      : usageStatusLabel}
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-2 bg-brand-500" style={{ width: `${usagePct}%` }} />
              </div>

              {usage.limit !== null && (
                <div className="mt-2 text-xs text-zinc-400">
                  {t("usage.messagesLeft", { count: usage.remaining ?? 0 })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="mb-8 overflow-hidden rounded-xl bg-zinc-900/70 border border-zinc-800 shadow-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-base font-semibold leading-6 text-zinc-100">
                {t("onboarding.title")}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                {t("onboarding.subtitle")}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-zinc-200">
                {t("onboarding.completion", { pct: completion })}
              </div>
              <div className="mt-2 h-2 w-40 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-2 bg-brand-500" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          {blockers.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
              <div className="text-sm font-medium text-zinc-200">
                {t("onboarding.requiredMissing")}
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-400">
                {blockers.map((b) => (
                  <li key={b.id}>
                    <Link className="text-brand-400 hover:text-brand-300 underline" href={b.href}>
                      {b.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {checklist.map((g) => (
              <div
                key={g.group}
                className="rounded-xl border border-zinc-800 bg-zinc-950/30 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/50">
                  <div className="text-sm font-medium text-zinc-200">{g.group}</div>
                  <Link
                    href={g.items[0]?.href ?? "/dashboard"}
                    className="text-sm font-medium text-brand-400 hover:text-brand-300"
                  >
                    {t("onboarding.open")}
                  </Link>
                </div>

                <ul className="divide-y divide-zinc-800">
                  {g.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={[
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                            it.done
                              ? "bg-brand-500/10 border-brand-500/20"
                              : it.required
                              ? "bg-zinc-700/30 border-zinc-600/40"
                              : "bg-zinc-800/40 border-zinc-700/50",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {it.done ? (
                            <span className="text-brand-300 text-xs">✓</span>
                          ) : it.required ? (
                            <span className="text-zinc-300 text-xs">!</span>
                          ) : (
                            <span className="text-zinc-400 text-xs">•</span>
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="text-sm truncate text-zinc-200">
                            {it.label}
                            {it.required && (
                              <span className="ml-2 text-xs text-zinc-500">
                                {t("onboarding.requiredTag")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!it.done ? (
                        <Link
                          href={it.href}
                          className={[
                            "text-sm font-medium shrink-0",
                            it.required
                              ? "text-zinc-300 hover:text-zinc-200"
                              : "text-brand-400 hover:text-brand-300",
                          ].join(" ")}
                        >
                          {it.required ? t("onboarding.fix") : t("onboarding.add")}
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-500 shrink-0">
                          {t("onboarding.done")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* currently unused but kept as your variable exists */}
          {featuresDisabled && null}
        </div>
      </div>
    </div>
  );
}
