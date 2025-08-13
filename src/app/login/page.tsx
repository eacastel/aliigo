"use client";

// File: app/login/page.tsx
// Purpose:
//   Authenticate with email/password and navigate to the dashboard.
//   Shows a generic error if credentials are invalid.
//
// Notes:
//   - Supports a future optional `?redirect=/path` query param.
//   - You can add "remember me", lockout after N attempts, etc., later.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // for optional ?redirect=/path

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
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Successful login → redirect
    // If a ?redirect=/path param exists, use it; otherwise go to /dashboard
    const redirect = searchParams.get("redirect");
    router.push(redirect || "/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
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
