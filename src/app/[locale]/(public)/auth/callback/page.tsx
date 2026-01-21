// src/app/[locale]/(public)/auth/callback/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Exchange the code in the URL for a session cookie
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        // (Optional) verify we really have a session now
        const { data: s } = await supabase.auth.getSession();

        if (error || !s.session) {
          console.error("Auth callback error:", error?.message);
          router.replace("/login");
          return;
        }

        router.replace("/dashboard");
      } catch (e) {
        console.error("Auth callback unexpected error:", e);
        router.replace("/login");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-sm text-gray-400">Confirmando tu acceso…</p>
    </div>
  );
}
