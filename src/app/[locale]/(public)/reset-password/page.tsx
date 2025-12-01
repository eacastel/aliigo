"use client";

// File: app/reset-password/page.tsx
// Purpose:
//   Ask for the user's email and send a password reset link via Supabase.
//   Supabase will email a magic "recovery" link that signs the user in
//   temporarily and redirects them to /update-password.
//
// Requirements:
//   - In Supabase Auth settings, "Site URL" and "Redirect URLs" must include your public domain.
//   - SITE_URL must match one of those allowed domains.
//
// Notes:
//   - We show a success message when the email is sent.
//   - Basic email validation can reduce unnecessary requests.

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/config";

export default function ResetPasswordPage() {
  // Form/UI state
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple email validation (optional; helps UX)
  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleReset = async () => {
    setError("");

    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    // Supabase will send a recovery email; the link will redirect to /update-password
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${SITE_URL}/update-password`,
    });

    if (error) {
      // Supabase often uses generic messages for security reasons; still useful to show to the user.
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Reset your password</h1>

      {sent ? (
        // Success state: instruct the user to check their inbox
        <p className="bg-green-100 text-green-800 p-4 rounded text-center">
          ✉️ We sent you a password reset link. Please check your email.
        </p>
      ) : (
        <>
          {/* Error message (if any) */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {/* Email input */}
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
            autoComplete="email"
            aria-label="Email"
          />

          {/* Submit button */}
          <button
            onClick={handleReset}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          {/* TODO: Optional link back to login */}
          {/* <p className="text-sm text-center mt-4"><a href="/login" className="underline">Back to login</a></p> */}
        </>
      )}
    </div>
  );
}
