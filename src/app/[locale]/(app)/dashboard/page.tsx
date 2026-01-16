"use client";

import { useEffect, useState, useMemo } from "react";
// IMPORTANT: Import router from your i18n routing file, not next/navigation
import { useRouter } from "@/i18n/routing"; 
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import { AliigoChatWidget } from "@/components/AliigoChatWidget";
import { useParams } from "next/navigation";

// Types
type BusinessProfile = {
  id: string;
  nombre_negocio: string | null;
  nombre_contacto: string | null;
  telefono: string | null;
  created_at: string | null;
  business_id?: string | null;
  businesses?: { slug: string } | null;
};

type PendingSignup = {
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  createdAtMs: number;
};

export default function DashboardPage() {
  
  // 1. Initialize Translations
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const t = useTranslations('Dashboard');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pending, setPending] = useState<PendingSignup | null>(null);

  // 2. Logic (Same as before, just cleaner)
  const daysLeft = useMemo(() => {
    const start = business?.created_at 
      ? new Date(business.created_at).getTime() 
      : pending?.createdAtMs;
      
    if (!start) return null;
    const daysPassed = Math.floor((Date.now() - start) / 86_400_000);
    return Math.max(30 - daysPassed, 0);
  }, [business, pending]);

  const bizSlug = business?.businesses?.slug || "horchata-labs";

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          const raw = localStorage.getItem("aliigo_pending_signup");
          if (raw) {
            setPending(JSON.parse(raw));
            setLoading(false);
            return;
          }
          router.replace("/signup");
          return;
        }

        localStorage.removeItem("aliigo_pending_signup");
        setIsConfirmed(Boolean(session.user.email_confirmed_at));

        const { data, error } = await supabase
          .from("business_profiles")
          .select(`*, businesses (slug)`)
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) console.error("DB Error:", error.message);
        if (mounted && data) setBusiness(data as BusinessProfile);

      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initDashboard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        setIsConfirmed(Boolean(session?.user?.email_confirmed_at));
      }
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleResend = async () => {
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email || pending?.email;
    if (!email) return;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` },
    });

    // Translation usage in alerts
    if (error) alert(t('resendError', { error: error.message }));
    else alert(t('resendSuccess'));
  };

  const featuresDisabled = !isConfirmed;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
        <span className="ml-3 text-gray-500">{t('loading')}</span>
      </div>
    );
  }

  // Helper variables for display
  const displayName = business?.nombre_contacto || pending?.contactName;
  const displayBusinessName = business?.nombre_negocio || pending?.businessName || t('businessInfo.defaultName');
  const displayEmail = business ? 'tu correo' : pending?.email;
  const displayPhone = business?.telefono || pending?.phone || "—";

  return (
    <div className="mx-auto mt-10 max-w-3xl px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {displayName 
            ? t('welcome', { name: displayName }) 
            : t('welcomeGeneric')
          } 👋
        </h1>
        {daysLeft !== null && (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            {t('trialDays', { days: daysLeft })}
          </span>
        )}
      </div>

      {/* VERIFICATION WARNING */}
      {!isConfirmed && (
        <div className="mb-8 rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{t('verifyTitle')}</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{t('verifyMessage', { email: displayEmail ?? "" })}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  className="rounded-md bg-yellow-100 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                >
                  {t('resendButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS INFO CARD */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            {displayBusinessName}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p><strong>{t('businessInfo.contactLabel')}</strong> {displayName || "—"}</p>
            <p><strong>{t('businessInfo.phoneLabel')}</strong> {displayPhone}</p>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${featuresDisabled ? "opacity-50 pointer-events-none grayscale" : ""}`}>
        <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 hover:border-gray-400">
           <div className="min-w-0 flex-1">
            <span className="absolute inset-0" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">{t('cards.reviewsTitle')}</p>
            <p className="truncate text-sm text-gray-500">{t('cards.reviewsDesc')}</p>
          </div>
        </div>
        
        <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 hover:border-gray-400">
           <div className="min-w-0 flex-1">
            <span className="absolute inset-0" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">{t('cards.campaignsTitle')}</p>
            <p className="truncate text-sm text-gray-500">{t('cards.campaignsDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}