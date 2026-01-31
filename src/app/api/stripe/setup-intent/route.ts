import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, type BusinessRow } from "@/lib/supabaseAdmin";
import { requireBusiness } from "@/lib/server/auth";

export const runtime = "nodejs";

type BizStripeSlice = Pick<BusinessRow, "id" | "name" | "stripe_customer_id">;

export async function POST(req: Request) {
  try {
    const { businessId, email } = await requireBusiness(req);

    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .select("id,name,stripe_customer_id")
      .eq("id", businessId)
      .single<BizStripeSlice>();

    if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 });

    let customerId = biz.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        name: biz.name ?? undefined,
        metadata: { business_id: businessId },
      });

      customerId = customer.id;

      const { error: upErr } = await supabaseAdmin
        .from("businesses")
        .update({ stripe_customer_id: customerId })
        .eq("id", businessId);

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
      metadata: { business_id: businessId },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret, customerId });
  } catch (e) {
    if (e instanceof Response) return e;
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
 