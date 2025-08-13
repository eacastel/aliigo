"use client";

/**
 * Purpose (English):
 * Simple page telling the user to check their email to confirm the account.
 * Includes a "Resend confirmation email" button and a link to login.
 * Redirect target in the email will be /login?from=confirm.
 */

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/config";

export default function CheckEmailPage() {
  const search = useSearchParams();
  const router = useRouter();
  const email = (search.get("email") ?? "").trim();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setErr("Falta el email.");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${SITE_URL}/login?from=confirm` },
    });

    setLoading(false);
    if (error) setErr(error.message);
    else setMsg("Te reenviamos el correo de confirmación.");
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Revisa tu correo</h1>

      <p className="text-gray-700 mb-4">
        Enviamos un enlace de confirmación a{" "}
        <strong>{email || "tu correo"}</strong>. Abre ese correo y haz clic en el
        enlace para activar tu cuenta.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Reenviar enlace de confirmación"}
        </button>

        <button
          onClick={() => router.push("/login")}
          className="w-full border border-gray-300 py-2 rounded hover:bg-gray-50"
        >
          Ir a iniciar sesión
        </button>
      </div>

      {msg && <p className="mt-4 text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-red-700">{err}</p>}

      <p className="mt-6 text-sm text-gray-600">
        Sugerencias: revisa SPAM/promociones. Si usas Gmail u Outlook, busca “Aliigo”.
      </p>
    </div>
  );
}
