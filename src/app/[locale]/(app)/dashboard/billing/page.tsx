import { headers } from "next/headers";
import { getCurrencyFromHeaders } from "@/lib/currency";
import BillingPageClient from "./BillingPageClient";

export default async function BillingPage() {
  const currency = getCurrencyFromHeaders(await headers());
  return <BillingPageClient initialCurrency={currency} />;
}
