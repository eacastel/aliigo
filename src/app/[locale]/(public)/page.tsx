import { headers } from "next/headers";
import { getCurrencyFromHeaders } from "@/lib/currency";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const currency = getCurrencyFromHeaders(await headers());
  return <HomePageClient initialCurrency={currency} />;
}
