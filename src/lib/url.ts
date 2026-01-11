// src/lib/url.ts

import { SITE_URL } from "./config";

/** Returns the public origin for redirects (browser origin first, then SITE_URL) */
export function getPublicOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}