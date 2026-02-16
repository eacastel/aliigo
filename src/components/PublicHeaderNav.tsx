"use client";

import { usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicAuthActions from "@/components/PublicAuthActions";
import PublicGetStartedButton from "@/components/PublicGetStartedButton";
import PublicMobileMenu from "@/components/PublicMobileMenu";

type PublicHeaderNavProps = {
  pricingLabel: string;
  whyAliigoLabel: string;
  founderLabel: string;
  getStartedLabel: string;
};

export default function PublicHeaderNav({
  pricingLabel,
  whyAliigoLabel,
  founderLabel,
  getStartedLabel,
}: PublicHeaderNavProps) {
  const pathname = usePathname();
  const isLp = pathname.includes("/lp/");
  const isSignupPage = pathname.endsWith("/signup") || pathname.endsWith("/registro");

  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-sm">
      {!isLp && !isSignupPage ? <LanguageSwitcher /> : null}

      {!isLp && !isSignupPage ? (
        <>
          <Link
            href="/pricing"
            className="hidden min-[897px]:block text-zinc-400 hover:text-white transition-colors"
          >
            {pricingLabel}
          </Link>
          <Link
            href="/why-aliigo"
            className="hidden min-[897px]:block text-zinc-400 hover:text-white transition-colors"
          >
            {whyAliigoLabel}
          </Link>
          <Link
            href="/founder"
            className="hidden min-[897px]:block text-zinc-400 hover:text-white transition-colors"
          >
            {founderLabel}
          </Link>
        </>
      ) : null}

      <PublicAuthActions className="hidden min-[897px]:flex items-center gap-3" />

      <PublicGetStartedButton
        className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md hover:bg-[#84c9ad] transition-colors whitespace-nowrap"
        label={getStartedLabel}
      />

      {!isLp && !isSignupPage ? <PublicMobileMenu /> : null}
    </nav>
  );
}
