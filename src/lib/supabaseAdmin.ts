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

  // Stripe / billing (add these)
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_plan: string | null;
  trial_end: string | null;          // ISO string from Supabase client
  current_period_end: string | null; // ISO string
  cancel_at_period_end: boolean | null;

  billing_status?: "incomplete" | "trialing" | "active" | "canceled" | "past_due";
};