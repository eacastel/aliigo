"use client";

// File: src/app/login/page.tsx
// Purpose:
//   Email/password login with optional redirect via query param (?redirect=/...).
//   Next.js 15 requires useSearchParams() to be inside a <Suspense> boundary.

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ====== Page shell (does not call useSearchParams) ======
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginWithSearchParams />
    </Suspense>
  );
}

// ====== Fallback UI while Suspense resolves searchParams ======
function LoginFallback() {
  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Aliigo</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// ====== Actual login component (safe to use useSearchParams here) ======
function LoginWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  // Form/UI state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    // Attempt password-based sign-in
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (loginError) {
      const msg = (loginError.message || "").toLowerCase();
      if (msg.includes("confirm")) {
        setError(
          "Please confirm your email before signing in. Check your inbox for the link."
        );
      } else {
        setError("Incorrect email or password.");
      }
      setLoading(false);
      return;
    }

    // Successful login → redirect (?redirect=/path supported)
    const redirect = searchParams.get("redirect");
    router.push(redirect || "/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      {from === "confirm" && (
        <p className="bg-green-100 text-green-800 p-3 rounded mb-4 text-center">
          ✅ Tu correo ha sido verificado. Ahora puedes iniciar sesión.
        </p>
      )}
      <h1 className="text-2xl font-bold mb-6 text-center">Sign in to Aliigo</h1>

      {/* Error message (if any) */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          autoComplete="email"
          aria-label="Email"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          autoComplete="current-password"
          aria-label="Password"
        />

        {/* Submit */}
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {/* Link to reset flow */}
        <p className="text-sm text-gray-600 text-center mt-4">
          Forgot your password?{" "}
          <a href="/reset-password" className="text-blue-600 underline">
            Reset it
          </a>
        </p>

        {/* TODO: Add magic-link or OAuth providers in the future */}
      </div>
    </div>
  );
}
