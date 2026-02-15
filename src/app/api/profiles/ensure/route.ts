// src/app/api/profiles/ensure/route.ts
import { NextResponse } from "next/server";
import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const looksLikeUUID = (v: unknown) =>
  typeof v === "string" && /^[0-9a-fA-F-]{36}$/.test(v);

function toSlug(name: string, fallback: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getAuthUserWithRetry(supabaseAdmin: SupabaseClient, id: string) {
  const waits = [0, 300, 700, 1200, 2000, 3500, 5000]; // ~12s total
  for (const w of waits) {
    if (w) await sleep(w);
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!error && data?.user) return data.user;
  }
  return null;
}


function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-client-ip") ||
    "unknown"
  ).trim();
}

async function enforceRateLimit(
  supabaseAdmin: SupabaseClient,
  req: Request,
  opts?: { bucket?: string; max?: number; windowMs?: number }
) {
  const bucket = opts?.bucket ?? "profiles_ensure";
  const max = opts?.max ?? 8; // tune this
  const windowMs = opts?.windowMs ?? 10 * 60 * 1000;

  const ip = getClientIp(req);
  const since = new Date(Date.now() - windowMs).toISOString();

  // 1) Record event (fail-open if table not present / schema mismatch)
  try {
    await supabaseAdmin.from("rate_events").insert({
      bucket,
      ip,
      created_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  // 2) Count recent events
  try {
    const { count } = await supabaseAdmin
      .from("rate_events")
      .select("id", { head: true, count: "exact" })
      .eq("bucket", bucket)
      .eq("ip", ip)
      .gte("created_at", since);

    if ((count ?? 0) > max) {
      return {
        limited: true,
        ip,
      };
    }
  } catch {
    // fail-open
  }

  return { limited: false, ip };
}


async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    return j && typeof j === "object" ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const startedAt = new Date().toISOString();

  try {
    const body = await readJson(req);

    const idRaw = body.id;
    const nombre_negocio = body.nombre_negocio;

    const nombre_contacto = (body.nombre_contacto ?? null) as string | null;
    const telefono = (body.telefono ?? null) as string | null;
    const email = (body.email ?? null) as string | null;

    // Optional extras
    const source = (body.source ?? null) as string | null;

    if (!looksLikeUUID(idRaw) || typeof nombre_negocio !== "string" || !nombre_negocio.trim()) {
      return NextResponse.json(
        {
          ok: false,
          where: "input",
          error: "Missing/invalid fields: id(uuid), nombre_negocio",
        },
        { status: 400, headers: CORS }
      );
    }
    if (source === "signup") {
      if (!email || !String(email).trim()) {
        return NextResponse.json(
          { ok: false, where: "input", error: "Missing field: email" },
          { status: 400, headers: CORS }
        );
      }
    }


    // ✅ TS-safe narrowing boundary
    const id = idRaw as string;


    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, where: "env", error: "Missing SUPABASE env (URL or SERVICE_ROLE_KEY)" },
        { status: 500, headers: CORS }
      );
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Rate limit (by IP)
    // For signup, skip this DB-backed limiter to avoid latency spikes/timeouts
    // during account creation. Keep limiter for all other sources.
    const isSignupSource = source === "signup";
    if (!isSignupSource) {
      const rl = await enforceRateLimit(supabaseAdmin, req, {
        bucket: "profiles_ensure",
        max: 8,
        windowMs: 10 * 60 * 1000,
      });

      if (rl.limited) {
        return NextResponse.json(
          { ok: false, where: "rate_limit", error: "Too many requests. Try again later." },
          { status: 429, headers: CORS }
        );
      }
    }

    // 0) Verify auth user exists (retry handles occasional propagation delay).
    // Skip this extra call for signup to reduce latency on critical conversion path.
    if (!isSignupSource) {
      const authUser = await getAuthUserWithRetry(supabaseAdmin, id);
      if (!authUser) {
        const host = (() => {
          try {
            return new URL(url).host;
          } catch {
            return url;
          }
        })();

        return NextResponse.json(
          {
            ok: false,
            where: "auth.admin.getUserById",
            error: "User not found in auth.users (after retry)",
            debug: { id, supabaseUrlHost: host },
          },
          { status: 409, headers: CORS }
        );
      }
    }

    // 1) Ensure business
    const rawName = String(nombre_negocio).trim() || "Negocio";
    const slug = toSlug(rawName, `biz-${String(id).slice(0, 8)}`);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .upsert({ slug, name: rawName }, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (bizErr || !biz) {
      const err = bizErr as PostgrestError | null;
      return NextResponse.json(
        {
          ok: false,
          where: "businesses.upsert",
          error: err?.message || "Upsert failed",
          details: err?.details ?? null,
          hint: err?.hint ?? null,
        },
        { status: 400, headers: CORS }
      );
    }

    // 2) Upsert profile linking business_id
    const { error: profErr } = await supabaseAdmin
      .from("business_profiles")
      .upsert(
        [
          {
            id, // FK -> auth.users.id
            nombre_negocio: rawName,
            nombre_contacto,
            telefono,
            email,
            source, // remove if column doesn't exist
            business_id: biz.id,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" }
      );

    if (profErr) {
      const err = profErr as PostgrestError;
      const maybeFk = `${err.message} ${err.details ?? ""}`.toLowerCase();
      if (maybeFk.includes("foreign key") || maybeFk.includes("violates")) {
        return NextResponse.json(
          {
            ok: false,
            where: "business_profiles.upsert",
            error: "User not found in auth.users (after retry)",
            details: err.details,
            hint: err.hint,
          },
          { status: 409, headers: CORS }
        );
      }
      return NextResponse.json(
        { ok: false, where: "business_profiles.upsert", error: err.message, details: err.details, hint: err.hint },
        { status: 500, headers: CORS }
      );
    }

    return NextResponse.json(
      { ok: true, startedAt, business_id: biz.id, slug: biz.slug },
      { status: 200, headers: CORS }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, where: "unexpected", error: msg },
      { status: 500, headers: CORS }
    );
  }
}
