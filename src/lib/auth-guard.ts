/**
 * Client-side session hardening:
 * - Ensures a valid current session AND a valid user from Supabase.
 * - If invalid (e.g., user deleted), signs out and redirects to login.
 * - Returns the user if everything is OK.
 */

import { supabase } from "@/lib/supabaseClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function enforceValidSession(
  router: AppRouterInstance,
  redirect = "/login?redirect=/dashboard"
) {
  // 1) Quick session presence check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    router.replace(redirect);
    return null;
  }

  // 2) Verify user on the auth server (catches deleted/invalid users)
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    // Clear local session and bounce to login
    await supabase.auth.signOut(); // clears local storage/cookies
    router.replace(redirect);
    return null;
  }

  return data.user;
}

/**
 * Subscribe to auth changes and auto-redirect to login if the user signs out
 * or the session becomes invalid.
 */
export function watchAuthAndRedirect(
  router: AppRouterInstance,
  redirect = "/login?redirect=/dashboard"
) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      router.replace(redirect);
    }
  });
  return () => sub.subscription.unsubscribe();
}
