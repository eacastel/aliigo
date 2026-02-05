// src/lib/server/auth.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export function getBearerToken(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1]!.trim() : "";
}

export async function requireUser(req: Request) {
  const jwt = getBearerToken(req);
  if (!jwt) throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate JWT server-side using admin client
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  const user = data?.user ?? null;

  if (error || !user) throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return { userId: user.id, email: user.email ?? null };
}

export async function getBusinessIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("business_profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle<{ business_id: string | null }>();

  if (error) throw NextResponse.json({ error: error.message }, { status: 500 });

  return data?.business_id ?? null;
}

export async function requireBusiness(req: Request) {
  const { userId, email } = await requireUser(req);
  const businessId = await getBusinessIdForUser(userId);

  if (!businessId) throw NextResponse.json({ error: "No business assigned" }, { status: 403 });

  return { userId, email, businessId };
}
