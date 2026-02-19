"use client";

export function openSupportWidgetPill() {
  if (typeof window === "undefined") return;
  const widget = document.querySelector(
    'aliigo-widget[data-owner="support"]',
  ) as HTMLElement | null;
  if (!widget || !widget.shadowRoot) return;
  const pillBtn = widget.shadowRoot.querySelector(".pill") as
    | HTMLButtonElement
    | null;
  pillBtn?.click();
}

