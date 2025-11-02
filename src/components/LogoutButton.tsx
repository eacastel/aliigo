"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      try { localStorage.removeItem("aliigo_pending_signup"); } catch {}
      router.replace("/login");
    }
  };

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className={`text-sm px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50 ${className}`}
    >
      {busy ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
