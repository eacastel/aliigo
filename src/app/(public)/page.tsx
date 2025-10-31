// app/page.tsx
import Link from "next/link";
// If you’ve added the chat widget already, uncomment:
// import { AliigoChatWidget } from "@/components/AliigoChatWidget";

export const metadata = {
  title: "Aliigo — Reputación y Automatización Local",
  description:
    "Solicita reseñas, conversa con clientes por web/WhatsApp y centraliza tu reputación. Un panel simple para crecer sin complicaciones.",
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl/tight md:text-5xl font-extrabold tracking-tight text-white">
                Reputación y conversaciones en un solo lugar.
              </h1>
              <p className="mt-5 text-lg text-zinc-300">
                Aliigo te ayuda a conseguir más reseñas, responder más rápido y
                convertir más, con un panel sencillo y automatizaciones listas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-100"
                >
                  Comenzar gratis (30 días)
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-900"
                >
                  Iniciar sesión
                </Link>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Sin tarjeta de crédito. Cancela cuando quieras.
              </p>
            </div>

            <div className="relative">
              {/* Placeholder screenshot/card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl">
                <div className="h-56 md:h-64 lg:h-80 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800">
                  {/* Replace with a real dashboard screenshot later */}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-zinc-400">
                  <div className="rounded-lg border border-zinc-800 p-3">
                    ⭐ Reseñas nuevas
                    <div className="mt-1 text-white text-lg font-semibold">+18</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-3">
                    💬 Conversaciones
                    <div className="mt-1 text-white text-lg font-semibold">+42</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-3">
                    ⏱️ Respuesta media
                    <div className="mt-1 text-white text-lg font-semibold">2m</div>
                  </div>
                </div>
              </div>
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -inset-4 -z-10 bg-[radial-gradient(40%_40%_at_70%_30%,rgba(59,130,246,0.25),transparent_60%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-center text-sm text-zinc-400">
            Elegido por clínicas, comercios y servicios locales.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 opacity-70">
            {/* Replace with small client logos */}
            <div className="h-10 rounded border border-zinc-800" />
            <div className="h-10 rounded border border-zinc-800" />
            <div className="h-10 rounded border border-zinc-800" />
            <div className="h-10 rounded border border-zinc-800" />
            <div className="h-10 rounded border border-zinc-800" />
            <div className="h-10 rounded border border-zinc-800" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">Todo lo clave, sin complicaciones</h2>
            <p className="mt-2 text-zinc-300">
              Enfocado en lo que mueve la aguja. Menos menús, más resultados.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Feature
              title="Solicitudes de reseñas"
              desc="Envía invitaciones por SMS o WhatsApp y consigue reseñas reales. Plantillas y recordatorios incluidos."
              bullets={[
                "Enlaces directos a Google/FB",
                "Recordatorios automáticos",
                "Plantillas con tu tono",
              ]}
            />
            <Feature
              title="Chat unificado"
              desc="Conversa desde web y WhatsApp en un solo buzón. Respuestas sugeridas por IA."
              bullets={[
                "Widget web en 2 minutos",
                "WhatsApp Business API",
                "Historial y etiquetas",
              ]}
            />
            <Feature
              title="Resumen de reputación"
              desc="Tus reseñas, resumidas cada semana con insights accionables. Sin perder tiempo."
              bullets={["Tendencias y alertas", "Sentimiento", "Acciones sugeridas"]}
            />
            <Feature
              title="Directorios y NAP"
              desc="Mantén nombre, dirección y teléfono sincronizados en los principales directorios."
              bullets={["Google / Bing / Apple / FB", "Sync programado", "Control desde el panel"]}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">Cómo funciona</h2>
            <p className="mt-2 text-zinc-300">
              Empieza hoy. Configura lo básico y deja que Aliigo haga el resto.
            </p>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              title="Crea tu cuenta"
              desc="Configura tu negocio y usuarios. Sin tarjeta, 30 días gratis."
            />
            <Step
              n={2}
              title="Activa canales"
              desc="Instala el chat web. Conecta WhatsApp. Personaliza mensajes."
            />
            <Step
              n={3}
              title="Mide y mejora"
              desc="Ve reseñas, conversaciones y resultados en el panel."
            />
          </ol>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white">Precios simples</h2>
              <p className="mt-2 text-zinc-300">
                Plan único para empezar. Actualiza cuando necesites más volumen o
                funciones avanzadas.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                <li>• Chat web + WhatsApp</li>
                <li>• Solicitudes de reseñas</li>
                <li>• Resumen semanal por IA</li>
                <li>• Directorios principales (sync básico)</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-100"
                >
                  Empezar gratis
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/50">
              <p className="text-5xl font-extrabold text-white">€XX<span className="text-2xl align-top">/mes</span></p>
              <p className="mt-2 text-zinc-400 text-sm">
                Precio de lanzamiento. Cambia cuando publiquemos el módulo de campañas.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-800 p-3">Usuarios incluidos</div>
                <div className="rounded-lg border border-zinc-800 p-3">Soporte por email</div>
                <div className="rounded-lg border border-zinc-800 p-3">Reportes básicos</div>
                <div className="rounded-lg border border-zinc-800 p-3">API conversacional</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-white">Preguntas frecuentes</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Faq q="¿Necesito tarjeta para la prueba?" a="No. Puedes crear tu cuenta y probar 30 días sin tarjeta." />
            <Faq q="¿Puedo cancelar en cualquier momento?" a="Sí. La cancelación es inmediata desde tu panel." />
            <Faq q="¿Cómo integro WhatsApp?" a="Usamos la API oficial. Te guiamos paso a paso en la configuración." />
            <Faq q="¿Soportáis múltiples ubicaciones?" a="Sí. Puedes gestionar varias ubicaciones dentro del mismo panel." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Listo para empezar
          </h2>
          <p className="mt-3 text-zinc-300">
            Crea tu cuenta en minutos y activa el chat. Todo desde un solo panel.
          </p>
          <div className="mt-7">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-100"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* If you want the chat widget on the homepage, uncomment below */}
      {/* <AliigoChatWidget businessSlug="horchata-labs" brand="Aliigo" /> */}
    </>
  );
}

// --- Small presentational components ---

function Feature({
  title,
  desc,
  bullets,
}: {
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-zinc-300 text-sm">{desc}</p>
      <ul className="mt-4 space-y-1 text-sm text-zinc-400">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-sm text-zinc-300">
        {n}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-zinc-300">{desc}</p>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
      <h3 className="text-white font-semibold">{q}</h3>
      <p className="mt-2 text-sm text-zinc-300">{a}</p>
    </div>
  );
}
