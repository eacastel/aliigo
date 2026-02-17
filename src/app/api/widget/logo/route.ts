import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminFromTable, supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 256 * 1024;
const BUCKET = "business-assets";

function getBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function planAllowsHeaderLogo(plan: string | null | undefined) {
  return plan === "growth" || plan === "pro" || plan === "custom";
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  return null;
}

async function resolveUserAndBusiness(req: NextRequest) {
  const token = getBearer(req);
  if (!token) return { error: "Unauthorized", status: 401 } as const;

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
  const userId = userRes?.user?.id ?? null;
  if (userErr || !userId) return { error: "Unauthorized", status: 401 } as const;

  const { data: prof, error: profErr } = await adminFromTable("business_profiles")
    .select("business_id")
    .eq("id", userId)
    .single<{ business_id: string | null }>();
  if (profErr || !prof?.business_id) {
    return { error: "Business not linked", status: 400 } as const;
  }

  const { data: biz, error: bizErr } = await adminFromTable("businesses")
    .select("id,billing_plan,widget_header_logo_path")
    .eq("id", prof.business_id)
    .single<{ id: string; billing_plan: string | null; widget_header_logo_path: string | null }>();
  if (bizErr || !biz) return { error: "Business not found", status: 404 } as const;

  return { userId, businessId: biz.id, billingPlan: biz.billing_plan, currentPath: biz.widget_header_logo_path } as const;
}

export async function GET(req: NextRequest) {
  const ctx = await resolveUserAndBusiness(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.currentPath) return NextResponse.json({ ok: true, hasLogo: false, logoUrl: null }, { status: 200 });

  const signed = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(ctx.currentPath, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json({ ok: true, hasLogo: false, logoUrl: null }, { status: 200 });
  }
  return NextResponse.json({ ok: true, hasLogo: true, logoUrl: signed.data.signedUrl }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ctx = await resolveUserAndBusiness(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!planAllowsHeaderLogo(ctx.billingPlan)) {
    return NextResponse.json({ error: "Header logo is available on Growth+ plans." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Invalid file size (max 256KB)." }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  const ext = extForMime(mime);
  if (!ext) {
    return NextResponse.json({ error: "Invalid file type. Use PNG/JPG/WEBP/SVG." }, { status: 400 });
  }

  const nextPath = `business/${ctx.businessId}/widget-header-logo.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const upload = await supabaseAdmin.storage.from(BUCKET).upload(nextPath, bytes, {
    upsert: true,
    contentType: mime,
    cacheControl: "3600",
  });
  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 });
  }

  if (ctx.currentPath && ctx.currentPath !== nextPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([ctx.currentPath]);
  }

  const upd = await adminFromTable("businesses")
    .update({ widget_header_logo_path: nextPath })
    .eq("id", ctx.businessId);
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 500 });
  }

  const signed = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(nextPath, 60 * 60);
  return NextResponse.json(
    { ok: true, path: nextPath, logoUrl: signed.data?.signedUrl ?? null },
    { status: 200 }
  );
}

export async function DELETE(req: NextRequest) {
  const ctx = await resolveUserAndBusiness(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  if (ctx.currentPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([ctx.currentPath]);
  }
  const upd = await adminFromTable("businesses")
    .update({ widget_header_logo_path: null })
    .eq("id", ctx.businessId);
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
