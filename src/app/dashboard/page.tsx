"use client";

// File: app/dashboard/page.tsx
// Purpose:
//   Match the agreed flow:
//   - After signup, user is sent to /dashboard even before confirming email.
//   - If there's no session but we detect a "pending signup" marker in localStorage,
//     we show the "check your email" banner + trial days and disable features.
//   - If there's a session, we load the real profile by PK (id = auth.users.id),
//     show the banner until email is confirmed, then enable features.
//   - If there's neither a session nor a pending marker, redirect to /signup.
//
// Notes:
//   - The pending marker is written by /signup as "aliigo_pending_signup" and has:
//       { email, businessName, contactName, phone, createdAtMs }
//   - We only use the marker to keep UX consistent pre-confirmation; we DO NOT trust it for data.
//   - RLS ensures only the owner can fetch their business profile when a session exists.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
};

// Shape of the pending marker saved by /signup
type PendingSignup = {
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  createdAtMs: number;
};

export default function DashboardPage() {
  const router = useRouter();

  // UI/state
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingSignup | null>(null); // no-session UX state

  // Main loader:
  //  - Try to get a session.
  //  - If no session: check localStorage for "aliigo_pending_signup".
  //    * If found -> show banner/trial with data from marker; do NOT query Supabase.
  //    * If not found -> redirect to /signup.
  //  - If there is a session: clear marker, load real profile, compute trial from created_at.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // No session — check if this user just signed up (client marker).
          let marker: PendingSignup | null = null;
          try {
            const raw = localStorage.getItem("aliigo_pending_signup");
            if (raw) marker = JSON.parse(raw) as PendingSignup;
          } catch {
            // ignore storage/JSON issues
          }

          if (marker) {
            // Show banner + trial based on marker.createdAtMs. No Supabase queries yet.
            setPending(marker);
            setIsConfirmed(false); // clearly unconfirmed at this point

            const daysPassed = Math.floor((Date.now() - marker.createdAtMs) / 86_400_000);
            setDaysLeft(Math.max(30 - daysPassed, 0));
            setBusiness(null);
            return; // leave loading=false in finally
          }

          // No session and no pending marker → user didn't sign up here; send to /signup
          router.replace("/signup");
          return;
        }

        // We have a session → clear any stale marker
        try {
          localStorage.removeItem("aliigo_pending_signup");
        } catch {}

        const user = session.user;
        setIsConfirmed(Boolean(user.email_confirmed_at));

        // Load the business profile by PK: id = auth.users.id
        const { data: row, error } = await supabase
          .from("business_profiles")
          .select("id,nombre_negocio,nombre_contacto,telefono,created_at")
          .eq("id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          // Not fatal; we still render the page and show a placeholder.
          console.error("Error loading business profile:", (error as { message?: string })?.message ?? error);
        }

        if (!cancelled && row) {
          setBusiness(row);

          // Trial days: 30 days from record's created_at
          if (row.created_at) {
            const createdAt = new Date(row.created_at);
            const daysPassed = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
            setDaysLeft(Math.max(30 - daysPassed, 0));
          } else {
            setDaysLeft(null);
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error("Unexpected error in dashboard load:", e.message);
        } else {
          console.error("Unexpected error in dashboard load:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // BONUS: auto-refresh email confirmation every 10s (if user confirms in another tab)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsConfirmed(Boolean(session?.user?.email_confirmed_at));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-4">
        {/* If we have a real profile, greet by contact; otherwise use a neutral fallback */}
        Welcome to Aliigo{business?.nombre_contacto ? `, ${business.nombre_contacto}` : ""} 👋
      </h1>

      {/* === Pending (no session yet, but just signed up) === */}
      {!business && pending && (
        <>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            ⚠️ Please confirm your email to activate your account. We sent a link to{" "}
            <strong>{pending.email}</strong>.
          </div>

          {daysLeft !== null && (
            <div className="mb-6 text-sm text-gray-600">
              ⏳ {daysLeft} days remaining in your free trial
            </div>
          )}

          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {pending.businessName ?? "Your business"}
            </h2>
            <p className="text-gray-700">
              <strong>Contact:</strong> {pending.contactName ?? "—"}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> {pending.email}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {pending.phone ?? "—"}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Features are disabled until you confirm your email.
            </p>
          </div>
        </>
      )}

      {/* === Session present (loaded profile) === */}
      {business && (
        <>
          {!isConfirmed && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
              ⚠️ Your account isn’t confirmed yet. Check your email to activate it.
            </div>
          )}

          {daysLeft !== null && (
            <div className="mb-6 text-sm text-gray-600">
              ⏳ {daysLeft} days remaining in your free trial
            </div>
          )}

          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {business.nombre_negocio ?? "Your business"}
            </h2>
            <p className="text-gray-700">
              <strong>Contact:</strong> {business.nombre_contacto ?? "—"}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {business.telefono ?? "—"}
            </p>
            {daysLeft !== null && (
              <p className="mt-4 text-sm text-gray-500">
                You have {daysLeft} trial days left.
              </p>
            )}
          </div>
        </>
      )}

      {/* Feature grid (disabled while unconfirmed or while in pending state) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
          (!isConfirmed || !!pending) ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Request reviews</h2>
          <p className="text-sm text-gray-600">
            Send review requests to your customers.
          </p>
        </div>
        <div className="bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-2">SMS campaigns</h2>
          <p className="text-sm text-gray-600">
            Create and launch direct messaging campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}
