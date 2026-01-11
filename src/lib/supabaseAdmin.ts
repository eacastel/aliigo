// src/lib/supabaseAdmin.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ---------- Server-only client ---------- */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only key

export const supabaseAdmin: SupabaseClient = createClient(url, key, {
  auth: { persistSession: false },
});

type TableNames =
  | "businesses"
  | "business_profiles"
  | "embed_tokens"
  | "conversations"
  | "messages"
  | "rate_events";

export function adminFromTable(table: TableNames) {
  return supabaseAdmin.from(table);
}

/* ---------- Re-export shared row types ---------- */
export type UUID = string;
export type MessageRow = {
  id: UUID;
  conversation_id: UUID;
  channel: "web" | "whatsapp" | "sms" | "email" | "telegram";
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  meta: Record<string, unknown>; // <-- add this
  created_at: string;
};
export type BusinessRow = {
  id: UUID;
  slug: string;
  name: string;
  timezone: string;
  created_at: string;
  system_prompt: string | null;
  allowed_domains: string[];
};
