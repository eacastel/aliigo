import { createHash, randomBytes } from "crypto";

export function createVerificationToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(token);
  return { token, tokenHash };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://aliigo.com"
  ).replace(/\/+$/, "");
}

