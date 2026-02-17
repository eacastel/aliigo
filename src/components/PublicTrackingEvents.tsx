"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/routing";
import { pushToGTM } from "@/lib/gtm";

function isSignupPath(pathname: string): boolean {
  return /\/(signup|registro)$/.test(pathname);
}

function isLpPath(pathname: string): boolean {
  return pathname === "/lp/website-ai-assistant";
}

function resolveMarketCurrency(pathname: string) {
  const params = new URLSearchParams(window.location.search);
  const marketRaw = (params.get("market") || "").toLowerCase();
  const currencyRaw = (params.get("currency") || "").toUpperCase();

  const inferredMarket =
    marketRaw ||
    (window.location.pathname.startsWith("/es/") ? "es" : window.location.pathname.startsWith("/en/") ? "us" : "");

  const inferredCurrency =
    currencyRaw ||
    (inferredMarket === "us" ? "USD" : inferredMarket ? "EUR" : "");

  return {
    market: inferredMarket || undefined,
    currency: inferredCurrency || undefined,
    path: pathname,
  };
}

export default function PublicTrackingEvents() {
  const pathname = usePathname();
  const pricingTrackedRef = useRef<string | null>(null);
  const lpTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === "/pricing" && pricingTrackedRef.current !== pathname) {
      pushToGTM("pricing_view", { path: pathname });
      pricingTrackedRef.current = pathname;
    }
    if (pathname !== "/pricing") {
      pricingTrackedRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    if (isLpPath(pathname) && lpTrackedRef.current !== pathname) {
      const payload = resolveMarketCurrency(pathname);
      pushToGTM("lp_view", {
        path: payload.path,
        market: payload.market,
        currency: payload.currency,
      });
      lpTrackedRef.current = pathname;
    }
    if (!isLpPath(pathname)) {
      lpTrackedRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (evt: MouseEvent) => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }

      if (!isSignupPath(url.pathname)) return;

      const text = (anchor.textContent || "").trim().slice(0, 80);
      const sourcePath = window.location.pathname;
      const payload = resolveMarketCurrency(sourcePath);
      pushToGTM("signup_intent", {
        path: payload.path,
        cta_text: text || undefined,
        market: payload.market,
        currency: payload.currency,
      });
      if (isLpPath(pathname)) {
        pushToGTM("lp_signup_intent", {
          path: payload.path,
          cta_text: text || undefined,
          market: payload.market,
          currency: payload.currency,
        });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}
