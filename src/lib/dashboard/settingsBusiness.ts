// src/lib/dashboard/settingsBusiness.ts

export type ProfileState = {
  nombre_negocio: string;
  nombre_contacto: string;
  telefono: string;
};

export type BusinessState = {
  name: string;
  timezone: string;
  system_prompt: string;
  knowledge: string;
  allowed_domains: string; // textarea (one per line)
  default_locale: "en" | "es";
};

type JoinedBusiness = {
  id?: string | null;
  name: string | null;
  timezone: string | null;
  slug?: string | null;
  system_prompt?: string | null;
  knowledge?: string | null;
  allowed_domains?: string[] | null;
  default_locale?: string | null;
} | null;

export type ProfileJoinRow = {
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  business_id: string | null;
  businesses: JoinedBusiness;
};

export function isProfileJoinRow(x: unknown): x is ProfileJoinRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    "business_id" in o &&
    "nombre_negocio" in o &&
    "nombre_contacto" in o &&
    "telefono" in o &&
    "businesses" in o
  );
}

export function domainsToText(domains: string[] | null | undefined): string {
  return (domains ?? []).join("\n");
}

export function textToDomains(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((d, i, a) => a.indexOf(d) === i);
}

export const SETTINGS_SELECT = `
  nombre_negocio,
  nombre_contacto,
  telefono,
  business_id,
  businesses:businesses!business_profiles_business_id_fkey (
    id,
    name,
    timezone,
    slug,
    system_prompt,
    knowledge,
    allowed_domains,
    default_locale
  )
`;
