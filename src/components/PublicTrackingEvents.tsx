"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/routing";
import { pushToGTM } from "@/lib/gtm";

function isSignupPath(pathname: string): boolean {
  return /\/(signup|registro)$/.test(pathname);
}

export default function PublicTrackingEvents() {
  const pathname = usePathname();
  const pricingTrackedRef = useRef<string | null>(null);

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
      pushToGTM("signup_intent", {
        path: window.location.pathname,
        cta_text: text || undefined,
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

