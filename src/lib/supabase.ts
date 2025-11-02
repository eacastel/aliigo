// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** ---------- Canonical row types (DB rows) ---------- */
export type UUID = string;

export type BusinessRow = {
  id: UUID;
  slug: string;
  name: string;
  timezone: string;
  created_at: string;
  system_prompt: string | null;
  allowed_domains: string[]; // not null in schema
};

export type BusinessProfileRow = {
  id: UUID; // auth.users.id
  business_id: UUID | null;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EmbedTokenRow = {
  id: UUID;
  business_id: UUID;
  token: string;
  created_at: string;
  last_rotated_at: string | null;
};

export type ConversationRow = {
  id: UUID;
  business_id: UUID;
  channel: "web" | "whatsapp" | "sms" | "email";
  external_ref: string | null;
  customer_name: string | null;
  status: string; // 'open' | 'closed' (free text in schema)
  created_at: string;
};

export type MessageRow = {
  id: UUID;
  conversation_id: UUID;
  channel: "web" | "whatsapp" | "sms" | "email";
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type RateEventRow = {
  id: number;
  ip: string; // inet
  bucket: string;
  business_id: UUID | null;
  created_at: string;
};

/** ---------- Public client (browser) ---------- */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
});

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.log("[supabase client] URL:", supabaseUrl);
}

/** ---------- Admin client (server routes only) ---------- */
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  { auth: { persistSession: false } }
);

/** ---------- Typed helpers to avoid generic overloads ---------- */
// ---------- Typed table name union ----------
type TableNames =
  | "businesses"
  | "business_profiles"
  | "embed_tokens"
  | "conversations"
  | "messages"
  | "rate_events";

// ---------- Lightweight helpers (no generics here) ----------
export function fromTable(table: TableNames) {
  return supabase.from(table);
}

export function adminFromTable(table: TableNames) {
  return supabaseAdmin.from(table);
}

/**
 * Optional: map table name -> row type (handy for `.returns<RowFor<...>>()`)
 */
export type RowFor<T extends TableNames> =
  T extends "businesses" ? BusinessRow :
  T extends "business_profiles" ? BusinessProfileRow :
  T extends "embed_tokens" ? EmbedTokenRow :
  T extends "conversations" ? ConversationRow :
  T extends "messages" ? MessageRow :
  T extends "rate_events" ? RateEventRow :
  never;

