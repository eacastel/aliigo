"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { supabase } from "@/lib/supabaseClient";

export default function PublicGetStartedButton({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(!!data.session?.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isSignupPage =
    pathname.endsWith("/signup") || pathname.endsWith("/registro");

  if (isAuthed || isSignupPage) return null;

  return (
    <Link href="/signup" className={className}>
      {label}
    </Link>
  );
}
