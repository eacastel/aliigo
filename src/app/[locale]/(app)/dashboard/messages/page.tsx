// src/app/[locale]/(app)/dashboard/messages/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type RecentMessageRow = {
  message_id: string;
  created_at: string;
  channel: string | null;
  role: string;
  content: string;
  meta: Record<string, unknown> | null;

  // RPCs commonly return one of these; we normalize.
  conversation_id?: string;
  conversationId?: string;
};

type ConversationRow = {
  // Depending on your RPC, this could be "id" (uuid) or "conversation_id"
  id?: string;
  conversation_id?: string;

  last_message_at: string | null;
  message_count: number | null;
};

type ViewTab = "recent" | "conversations";

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function clampText(s: string, max = 220) {
  const v = s.trim();
  if (v.length <= max) return v;
  return `${v.slice(0, max)}…`;
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeForRole(role: string) {
  const r = role.toLowerCase();
  if (r === "user") return "bg-zinc-800/50 border-zinc-700/50 text-zinc-200";
  if (r === "assistant") return "bg-brand-500/10 border-brand-500/20 text-brand-200";
  if (r === "system") return "bg-amber-500/10 border-amber-500/20 text-amber-200";
  return "bg-zinc-800/40 border-zinc-700/40 text-zinc-200";
}

function convIdFromRecent(m: RecentMessageRow) {
  return safeStr(m.conversation_id ?? m.conversationId);
}

function convIdFromConvo(c: ConversationRow) {
  return safeStr(c.conversation_id ?? c.id);
}

export default function DashboardMessagesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ViewTab>("recent");
  const [error, setError] = useState<string | null>(null);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(true);

  const [recent, setRecent] = useState<RecentMessageRow[]>([]);
  const [convos, setConvos] = useState<ConversationRow[]>([]);

  const initialQuery = searchParams.get("conversationId") || "";
  const [query, setQuery] = useState(initialQuery);
  const q = query.trim().toLowerCase();

  const filteredRecent = useMemo(() => {
    if (!q) return recent;
    return recent.filter((m) => (m.content || "").toLowerCase().includes(q));
  }, [recent, q]);

  const filteredConvos = useMemo(() => {
    if (!q) return convos;
    return convos.filter((c) => convIdFromConvo(c).toLowerCase().includes(q));
  }, [convos, q]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session?.user) {
          router.replace("/login?redirect=/dashboard/messages");
          return;
        }

        const u = session.user as unknown as Record<string, unknown>;
        const confirmed = Boolean(u["email_confirmed_at"] || u["confirmed_at"]);
        if (!cancelled) setEmailConfirmed(confirmed);

        // Fetch business_id for this user (business_profiles.id == auth.user.id)
        const { data: prof, error: profErr } = await supabase
          .from("business_profiles")
          .select("business_id")
          .eq("id", session.user.id)
          .maybeSingle<{ business_id: string | null }>();

        if (profErr) {
          throw new Error(profErr.message || "Failed to load business profile.");
        }

        const bid = prof?.business_id ?? null;
        if (!bid) {
          throw new Error("Missing business_id for this account.");
        }
        if (!cancelled) setBusinessId(bid);

        // 1) Recent messages across all conversations for this business
        const { data: rec, error: recErr } = await supabase.rpc("messages_recent_for_business", {
          p_business_id: bid,
          p_limit: 200,
        });

        // 2) Conversation list for this business
        const { data: cv, error: cvErr } = await supabase.rpc("conversations_recent_for_business", {
          p_business_id: bid,
          p_limit: 60,
        });

        if (recErr) {
          throw new Error(`Missing RPC "messages_recent_for_business" or query failed: ${recErr.message}`);
        }
        if (cvErr) {
          throw new Error(`Missing RPC "conversations_recent_for_business" or query failed: ${cvErr.message}`);
        }

        const recRows = (Array.isArray(rec) ? rec : []) as RecentMessageRow[];
        const cvRows = (Array.isArray(cv) ? cv : []) as ConversationRow[];

        if (!cancelled) {
          setRecent(recRows);
          setConvos(cvRows);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load messages.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const conv = searchParams.get("conversationId");
    if (conv) {
      setQuery(conv);
      setTab("conversations");
    }
  }, [searchParams]);

  const openConversation = (conversationId: string) => {
    if (!conversationId) return;
    router.push(`/dashboard/messages?conversationId=${conversationId}`);
  };

  return (
    <div className="mx-auto mt-10 max-w-5xl px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            {t("Dashboard.messages.title", { default: "Messages" })}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {t("Dashboard.messages.subtitle", {
              default: "Review conversations and recent messages from your website assistant.",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[320px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Dashboard.messages.searchPlaceholder", {
                default: "Search messages / conversation IDs…",
              })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>
        </div>
      </div>

      {/* Email confirmation notice (soft) */}
      {!emailConfirmed && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-100">
                {t("Dashboard.messages.verifyTitle", { default: "Verify your email" })}
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {t("Dashboard.messages.verifyBody", {
                  default:
                    "Some features may be limited until your email is confirmed. If you already confirmed, sign out and sign back in to refresh your session.",
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="font-medium">Error</div>
          <div className="mt-1 text-red-200/90">{error}</div>

          <div className="mt-3 text-xs text-red-200/70">
            Hint: This page expects two Supabase RPCs:{" "}
            <span className="font-mono">messages_recent_for_business</span> and{" "}
            <span className="font-mono">conversations_recent_for_business</span>.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("recent")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors",
            tab === "recent"
              ? "bg-brand-500/10 text-brand-200 ring-brand-500/25"
              : "bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40",
          ].join(" ")}
        >
          {t("Dashboard.messages.tabRecent", { default: "Recent messages" })}
          <span className="ml-2 text-xs text-zinc-400">({filteredRecent.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("conversations")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors",
            tab === "conversations"
              ? "bg-brand-500/10 text-brand-200 ring-brand-500/25"
              : "bg-zinc-950/30 text-zinc-300 ring-zinc-800 hover:bg-zinc-900/40",
          ].join(" ")}
        >
          {t("Dashboard.messages.tabConversations", { default: "Conversations" })}
          <span className="ml-2 text-xs text-zinc-400">({filteredConvos.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-lg">
        {loading ? (
          <div className="flex items-center gap-3 p-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300/40 border-t-brand-500/70" />
            <div className="text-sm text-zinc-300">{t("Dashboard.messages.loading", { default: "Loading…" })}</div>
          </div>
        ) : tab === "recent" ? (
          <ul className="divide-y divide-zinc-800">
            {filteredRecent.length === 0 ? (
              <li className="p-6 text-sm text-zinc-400">{t("Dashboard.messages.emptyRecent", { default: "No messages yet." })}</li>
            ) : (
              filteredRecent.map((m) => {
                const cid = convIdFromRecent(m);
                const cidLabel = cid ? `${cid.slice(0, 8)}…${cid.slice(-6)}` : "—";
                const canOpen = Boolean(cid);

                return (
                  <li key={m.message_id} className="p-5 hover:bg-zinc-950/30 transition-colors">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              badgeForRole(m.role),
                            ].join(" ")}
                          >
                            {m.role}
                          </span>

                          {m.channel && (
                            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/30 px-2 py-0.5 text-xs text-zinc-300">
                              {m.channel}
                            </span>
                          )}

                          <span className="text-xs text-zinc-500">{fmtWhen(m.created_at)}</span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{clampText(m.content, 320)}</p>

                        <div className="mt-2 text-xs text-zinc-500">
                          Conversation:{" "}
                          <button
                            type="button"
                            disabled={!canOpen}
                            onClick={() => openConversation(cid)}
                            className={[
                              "underline underline-offset-2 font-mono",
                              canOpen ? "text-brand-400 hover:text-brand-300" : "text-zinc-600 cursor-not-allowed",
                            ].join(" ")}
                          >
                            {cidLabel}
                          </button>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          disabled={!canOpen}
                          onClick={() => openConversation(cid)}
                          className={[
                            "rounded-lg border px-3 py-2 text-xs font-medium",
                            canOpen
                              ? "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900/50"
                              : "border-zinc-800 bg-zinc-950/10 text-zinc-500 cursor-not-allowed",
                          ].join(" ")}
                        >
                          {t("Dashboard.messages.open", { default: "Open" })}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filteredConvos.length === 0 ? (
              <li className="p-6 text-sm text-zinc-400">
                {t("Dashboard.messages.emptyConversations", { default: "No conversations yet." })}
              </li>
            ) : (
              filteredConvos.map((c, idx) => {
                const cid = convIdFromConvo(c);
                const cidLabel = cid ? `${cid.slice(0, 8)}…${cid.slice(-6)}` : "—";
                const canOpen = Boolean(cid);

                return (
                  <li key={cid || `${c.last_message_at || "no-last"}-${idx}`} className="p-5 hover:bg-zinc-950/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-200">
                          <button
                            type="button"
                            disabled={!canOpen}
                            onClick={() => openConversation(cid)}
                            className={[
                              "font-mono underline underline-offset-2",
                              canOpen ? "text-brand-400 hover:text-brand-300" : "text-zinc-600 cursor-pointer disabled:cursor-not-allowed",
                            ].join(" ")}
                          >
                            {cidLabel}
                          </button>
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          Last message: {c.last_message_at ? fmtWhen(c.last_message_at) : "—"} · Messages: {c.message_count ?? 0}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canOpen}
                        onClick={() => openConversation(cid)}
                        className={[
                          "rounded-lg border px-3 py-2 text-xs font-medium",
                          canOpen
                            ? "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-900/50"
                            : "border-zinc-800 bg-zinc-950/10 text-zinc-500 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {t("Dashboard.messages.open", { default: "Open" })}
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 text-xs text-zinc-500">
        {t("Dashboard.messages.footerNote", {
          default: "Tip: This page loads tenant-scoped data using your business_id derived from business_profiles.",
        })}
        {businessId ? <span className="ml-2 font-mono text-zinc-600">biz:{safeStr(businessId).slice(0, 8)}…</span> : null}
      </div>
    </div>
  );
}
