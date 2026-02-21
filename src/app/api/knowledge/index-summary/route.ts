import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { effectivePlanForEntitlements } from "@/lib/effectivePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageRaw = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    if (!token) return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const authed = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await authed.auth.getUser();
    const userId = userRes?.user?.id;
    if (userErr || !userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error: pErr } = await admin
      .from("business_profiles")
      .select("business_id")
      .eq("id", userId)
      .single<{ business_id: string | null }>();
    if (pErr || !profile?.business_id) {
      return NextResponse.json({ error: "Business not linked to profile" }, { status: 400 });
    }
    const businessId = profile.business_id;

    const { data: business, error: bErr } = await admin
      .from("businesses")
      .select("billing_plan,billing_status,trial_end")
      .eq("id", businessId)
      .single<{
        billing_plan: string | null;
        billing_status: "incomplete" | "trialing" | "active" | "canceled" | "past_due" | null;
        trial_end: string | null;
      }>();
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 400 });
    const effectivePlan = effectivePlanForEntitlements({
      billingPlan: business.billing_plan,
      billingStatus: business.billing_status,
      trialEnd: business.trial_end,
    });
    if (effectivePlan === "basic" || effectivePlan === "starter") {
      return NextResponse.json(
        { error: "Indexed content is available on Growth+ plans." },
        { status: 403 },
      );
    }

    const [runsRes, docsRes, chunksRes, docsCountRes, chunksCountRes] = await Promise.all([
      admin
        .from("knowledge_ingestion_runs")
        .select("id,status,pages_scanned,documents_upserted,chunks_upserted,started_at,finished_at,errors")
        .eq("business_id", businessId)
        .order("started_at", { ascending: false })
        .limit(6),
      admin
        .from("knowledge_documents")
        .select("id,source_url,source_label,locale,status,updated_at")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .range(from, to),
      admin
        .from("knowledge_chunks")
        .select("document_id,content,chunk_index,updated_at")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(80),
      admin
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),
      admin
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),
    ]);

    if (runsRes.error) return NextResponse.json({ error: runsRes.error.message }, { status: 400 });
    if (docsRes.error) return NextResponse.json({ error: docsRes.error.message }, { status: 400 });
    if (chunksRes.error) return NextResponse.json({ error: chunksRes.error.message }, { status: 400 });

    const chunks = chunksRes.data ?? [];
    const chunkPreviewByDoc = new Map<string, { preview: string; updatedAt: string }>();
    const chunkCountByDoc = new Map<string, number>();

    for (const c of chunks) {
      const docId = c.document_id as string;
      chunkCountByDoc.set(docId, (chunkCountByDoc.get(docId) ?? 0) + 1);
      if (!chunkPreviewByDoc.has(docId)) {
        const preview = String(c.content ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
        chunkPreviewByDoc.set(docId, {
          preview,
          updatedAt: String(c.updated_at ?? ""),
        });
      }
    }

    const documents = (docsRes.data ?? []).map((d) => ({
      ...d,
      chunkCount: chunkCountByDoc.get(String(d.id)) ?? 0,
      preview: chunkPreviewByDoc.get(String(d.id))?.preview ?? "",
      previewUpdatedAt: chunkPreviewByDoc.get(String(d.id))?.updatedAt ?? null,
    }));

    return NextResponse.json({
      ok: true,
      totals: {
        documents: docsCountRes.count ?? 0,
        chunks: chunksCountRes.count ?? 0,
      },
      pagination: {
        page,
        limit,
      },
      runs: runsRes.data ?? [],
      documents,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
