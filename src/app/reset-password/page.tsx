"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from '@/lib/config'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Recuperar contraseña
      </h1>

      {sent ? (
        <p className="bg-green-100 text-green-800 p-4 rounded text-center">
          ✉️ Te hemos enviado un enlace para restablecer tu contraseña. Revisa
          tu correo electrónico.
        </p>
      ) : (
        <>
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
          />

          <button
            onClick={handleReset}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Enviar enlace de recuperación
          </button>
        </>
      )}
    </div>
  );
}
