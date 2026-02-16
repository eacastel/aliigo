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
      const params = new URLSearchParams(window.location.search);
      pushToGTM("lp_view", {
        path: pathname,
        market: params.get("market") ?? undefined,
        currency: params.get("currency") ?? undefined,
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
      const params = new URLSearchParams(window.location.search);
      pushToGTM("signup_intent", {
        path: sourcePath,
        cta_text: text || undefined,
        market: params.get("market") ?? undefined,
        currency: params.get("currency") ?? undefined,
      });
      if (isLpPath(pathname)) {
        pushToGTM("lp_signup_intent", {
          path: sourcePath,
          cta_text: text || undefined,
          market: params.get("market") ?? undefined,
          currency: params.get("currency") ?? undefined,
        });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}
