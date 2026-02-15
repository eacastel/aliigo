// src/app/lib/supabaseClient.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ---------- Shared row types ---------- */
export type UUID = string;

export type BusinessRow = {
  id: UUID;
  slug: string;
  name: string;
  timezone: string;
  created_at: string;
  system_prompt: string | null;
  allowed_domains: string[];
  billing_plan?: string | null;
  seat_limit?: number | null;
  domain_limit?: number | null;
};

export type BusinessProfileRow = {
  id: UUID;
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
  customer_name: string | null;
  status: string;
  created_at: string;
};

export type MessageRow = {
  id: UUID;
  conversation_id: UUID;
  channel: "web" | "whatsapp" | "sms" | "email" | "telegram";
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  meta: Record<string, unknown>; // <-- add this
  created_at: string;
};

export type RateEventRow = {
  id: number;
  ip: string;
  bucket: string;
  business_id: UUID | null;
  created_at: string;
};

/* ---------- Browser client ---------- */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(url, anon, {
  auth: { persistSession: true },
});

type TableNames =
  | "businesses"
  | "business_profiles"
  | "embed_tokens"
  | "conversations"
  | "messages"
  | "rate_events";

export function fromTable(table: TableNames) {
  return supabase.from(table);
}
