"use client";

/**
 * File: src/app/login/page.tsx
 * Purpose:
 *   Email/password login with optional redirect via ?redirect=/...
 *   Next.js 15 requires useSearchParams() inside a <Suspense> boundary.
 * Notes:
 *   - UI text: Spanish (Castilian)
 *   - Comments + code: English
 *   - Security: do NOT reveal whether an email exists on login (avoid enumeration).
 */

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuthError } from "@supabase/supabase-js";

// If you want to use "resend confirmation" from login, set NEXT_PUBLIC_SITE_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginWithSearchParams />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Inicia sesión en Aliigo</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function LoginWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from"); // e.g. "confirm" after email verification

  // Form/UI state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Handle login attempt with safe error messaging
  const handleLogin = async () => {
    setMsg(null);

    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      setMsg({ type: "error", text: "Por favor, introduce tu correo y contraseña." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        const e = error as AuthError;

        // Distinguish a few useful cases without confirming account existence
        if (e.status === 422) {
          // Email not confirmed
          setMsg({
            type: "error",
            text:
              "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o reenvía la confirmación.",
          });
        } else if (e.status === 429) {
          // Rate limited
          setMsg({
            type: "error",
            text: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
          });
        } else {
          // Generic invalid credentials (do not reveal whether the email exists)
          setMsg({ type: "error", text: "Correo electrónico o contraseña no válidos." });
        }
        return;
      }

      // Successful login → redirect (?redirect=/path supported)
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Optional: allow resending the confirmation email from the login screen
  const handleResendConfirmation = async () => {
    setMsg(null);

    const targetEmail = email.trim();
    if (!targetEmail) {
      setMsg({ type: "error", text: "Introduce tu correo electrónico para reenviar la confirmación." });
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: SITE_URL ? { emailRedirectTo: `${SITE_URL}/dashboard` } : undefined,
      });

      if (error) {
        // Keep response generic
        setMsg({
          type: "error",
          text: "No se pudo reenviar la confirmación en este momento. Inténtalo de nuevo.",
        });
      } else {
        setMsg({
          type: "ok",
          text: "Si existe una cuenta con ese correo, hemos reenviado el mensaje de confirmación.",
        });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      {from === "confirm" && (
        <p className="bg-green-100 text-green-800 p-3 rounded mb-4 text-center">
          ✅ Tu correo ha sido verificado. Ahora puedes iniciar sesión.
        </p>
      )}

      <h1 className="text-2xl font-bold mb-6 text-center">Inicia sesión en Aliigo</h1>

      {/* Message area */}
      {msg && (
        <p
          className={
            msg.type === "error"
              ? "text-red-600 mb-4"
              : msg.type === "ok"
              ? "text-green-700 mb-4"
              : "text-blue-700 mb-4"
          }
        >
          {msg.text}
        </p>
      )}

      <div className="space-y-4">
        {/* Email */}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          autoComplete="email"
          aria-label="Correo electrónico"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          autoComplete="current-password"
          aria-label="Contraseña"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) void handleLogin();
          }}
        />

        {/* Submit */}
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>

        {/* Reset password link */}
        <p className="text-sm text-gray-600 text-center mt-2">
          ¿Has olvidado tu contraseña?{" "}
          <a href="/reset-password" className="text-blue-600 underline">
            Restablécela
          </a>
        </p>

        {/* Optional: Resend confirmation (does not reveal existence) */}
        <button
          type="button"
          onClick={handleResendConfirmation}
          className="w-full border border-gray-300 py-2 rounded hover:bg-gray-50 disabled:opacity-50 mt-2"
          disabled={resending}
        >
          {resending ? "Reenviando…" : "Reenviar correo de confirmación"}
        </button>

        {/* TODO: Add magic-link or OAuth providers in the future */}
      </div>
    </div>
  );
}
