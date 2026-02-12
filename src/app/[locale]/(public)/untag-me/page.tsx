import { cookies } from "next/headers";
import Link from "next/link";

export default function UntagMePage({
  params,
}: {
  params: { locale: string };
}) {
  const cookieStore = cookies();
  cookieStore.set("aliigo_tagging", "off", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 2,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const isEs = params.locale === "es";

  return (
    <main className="min-h-dvh bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          {isEs ? "Medición desactivada" : "Tracking disabled"}
        </h1>
        <p className="text-zinc-400 text-sm">
          {isEs
            ? "Las etiquetas de marketing están deshabilitadas en este navegador."
            : "Marketing tags are disabled in this browser."}
        </p>
        <Link
          href={`/${params.locale}`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-zinc-600"
        >
          {isEs ? "Volver al inicio" : "Back to home"}
        </Link>
      </div>
    </main>
  );
}
