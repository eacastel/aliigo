"use client";

import { useEffect, useState } from "react";
import { AliigoSupportWidget } from "@/components/AliigoSupportWidget";

export function HomeFloatingWidgetGate() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    let intervalId: number | null = null;
    let mounted = true;

    const attach = (el: Element) => {
      obs = new IntersectionObserver(
        ([entry]) => {
          // hide floating widget while demo is on screen
          const demoVisible =
            entry.isIntersecting && entry.intersectionRatio > 0.25;
          if (mounted) setShow(!demoVisible);
        },
        { threshold: [0, 0.25, 0.5, 1] },
      );
      obs.observe(el);
    };

    const tryAttach = () => {
      const el = document.getElementById("homepage-assistant-demo");
      if (!el) return false;
      attach(el);
      return true;
    };

    if (!tryAttach()) {
      // Demo renders after token fetch; retry briefly
      const start = Date.now();
      intervalId = window.setInterval(() => {
        if (tryAttach() || Date.now() - start > 10_000) {
          if (intervalId) window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);
    }

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      obs?.disconnect();
    };
  }, []);

  if (!show) return null;

  return (
    <AliigoSupportWidget />
  );
}
