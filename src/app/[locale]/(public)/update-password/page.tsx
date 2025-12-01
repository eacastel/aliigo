"use client";

// File: app/update-password/page.tsx
// Purpose:
//   Let the user set a new password after clicking the recovery link from email.
//   The recovery link creates a short-lived session, which allows updateUser({ password }).
//
// Flow:
//   1) User clicks email link → browser opens this page with a "recovery" session.
//   2) User enters and confirms new password.
//   3) On success, show a success message and redirect to /login.
//
// Notes:
//   - If the user opens this page without a recovery session, updateUser will fail
//     (e.g., token expired). The user should redo the "reset password" flow.
//   - You can add custom password strength checks here.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function UpdatePasswordPage() {
  const router = useRouter();

  // Form/UI state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic strength rule (adjust to your needs)
  const isPasswordStrongEnough = (pwd: string) => pwd.length >= 8;

  const handleUpdate = async () => {
    setError("");

    // Client-side checks before calling Supabase
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isPasswordStrongEnough(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    // Supabase will attempt to update the password on the current session (recovery)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      // Common cases: invalid/expired token if the user took too long.
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after a short delay
    setTimeout(() => router.push("/login"), 2500);
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Set a new password</h1>

      {success ? (
        // Success state: show confirmation then auto-redirect
        <p className="bg-green-100 text-green-800 p-4 rounded text-center">
          ✅ Your password has been updated. Redirecting to login…
        </p>
      ) : (
        <>
          {/* Error message (if any) */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {/* New password */}
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
            autoComplete="new-password"
            aria-label="New password"
          />

          {/* Confirm password */}
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
            autoComplete="new-password"
            aria-label="Confirm new password"
          />

          {/* Submit */}
          <button
            onClick={handleUpdate}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving…" : "Save new password"}
          </button>

          {/* TODO: Optional link back to reset flow if token expired */}
          {/* <p className="text-sm text-center mt-4"><a href="/reset-password" className="underline">Start reset again</a></p> */}
        </>
      )}
    </div>
  );
}
