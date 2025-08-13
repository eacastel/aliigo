"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // This exchanges the `code` in the URL for a session cookie
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error("Auth callback error:", error.message);
        router.replace("/login"); // fallback if something goes wrong
        return;
      }
      router.replace("/dashboard");
    };
    run();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-sm text-gray-600">Signing you in…</p>
    </div>
  );
}
