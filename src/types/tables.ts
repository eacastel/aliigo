// Minimal row types for our Supabase tables (manual, since we’re not using gen types)

export type UUID = string;

export type BusinessProfileRow = {
  id: UUID;                           // auth.users.id
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
  updated_at: string | null;
  email: string | null;
  business_id: UUID | null;
};

export type BusinessRow = {
  id: UUID;
  slug: string;
  name: string;
  timezone: string;
  created_at: string;
  system_prompt: string | null;
  allowed_domains: string[] | null;
};

export type EmbedTokenRow = {
  id: UUID;
  business_id: UUID;
  token: string;
  created_at: string;
  last_rotated_at: string | null;
};
