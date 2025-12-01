import Link from "next/link";
import HeroRotator from "@/components/HeroRotator";
import { AliigoSupportWidget } from "@/components/AliigoSupportWidget";

export const metadata = {
  title: "Aliigo — Reputación y Automatización Local (Acceso por invitación)",
  description:
    "Aliigo ayuda a negocios locales a conseguir más reseñas, responder más rápido y centralizar conversaciones en un solo panel. Acceso en beta privada por invitación.",
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
                Chat con IA y reputación en un solo lugar.
              </h1>
              <p className="mt-5 text-lg text-zinc-300">
                Aliigo combina un asistente con IA que responde al instante
                usando la información de tu negocio, un buzón centralizado para
                tus mensajes y tus reseñas de Google en un solo panel.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-100"
                >
                  Solicitar invitación
                </Link>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Beta privada. Aceptamos unos pocos negocios por mes con
                condiciones especiales desde{" "}
                <span className="font-semibold text-zinc-200">49 €/mes</span>.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 shadow-2xl">
                <HeroRotator />
              </div>
              <div className="pointer-events-none absolute -inset-4 -z-10 bg-[radial-gradient(40%_40%_at_70%_30%,rgba(59,130,246,0.25),transparent_60%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-zinc-950 border-b border-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-white text-center px-4 md:max-w-2xl mx-auto">
            Diseñado para empresas, autónomos y servicios profesionales que
            viven de su reputación.
          </h2>

          <div className="mt-10 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              "Clínicas",
              "Escuelas",
              "Estética avanzada",
              "Fisioterapia",
              "Servicios profesionales",
              "Centros médicos",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center justify-center 
      py-3 px-2 whitespace-nowrap
      rounded-lg border border-zinc-700 
      bg-zinc-900/60 text-zinc-200 font-medium text-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">
              Todo lo clave, sin complicaciones
            </h2>
            <p className="mt-2 text-zinc-300">
              Empezamos por lo que de verdad mueve la aguja: que te escriban,
              que puedas responder rápido y que tu reputación en Google esté
              bajo control.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Feature
              n={1}
              title="Chat con IA para tu web"
              desc="Un asistente que responde automáticamente usando la información que tú le das sobre tu negocio (en beta privada)."
              bullets={[
                "Entrénalo con tus servicios, horarios y preguntas frecuentes",
                "Respuestas inmediatas 24/7 (en pruebas dentro de la beta)",
                "Diseñado para que puedas intervenir cuando lo necesites",
              ]}
            />

            <Feature
              n={2}
              title="Un solo buzón para tus conversaciones"
              desc="Gestión centralizada para los mensajes que llegan desde el widget web; más canales se irán añadiendo en las siguientes versiones."
              bullets={[
                "Historial por cliente",
                "Notas internas",
                "Etiquetas personalizadas",
              ]}
            />

            <Feature
              n={3}
              title="Reseñas de Google en un solo lugar"
              desc="Consulta de un vistazo tus reseñas de Google y detecta problemas antes de que se hagan grandes."
              bullets={[
                "Listado de reseñas recientes",
                "Indicadores de volumen y valoración media",
                "Enlace directo para responder desde Google Business Profile",
              ]}
            />

            <Feature
              n={4}
              title="Solicitudes de reseñas"
              desc="Envía enlaces directos y anima a tus clientes satisfechos a dejar reseña."
              bullets={[
                "Plantillas listas para copiar",
                "Texto optimizado para WhatsApp o email",
                "Enlace directo a tu ficha de Google",
              ]}
            />
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            En desarrollo dentro de la beta: integración con WhatsApp Business,
            lectura automática de reseñas de Google Business Profile y resúmenes
            de reputación por IA. Más adelante: conexión con otros directorios
            (Bing, Apple, etc.).
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">Cómo funciona</h2>
            <p className="mt-2 text-zinc-300">
              Estamos en beta privada. El proceso es simple: te apuntas, te
              revisamos y, si encaja, te activamos.
            </p>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              title="Solicita invitación"
              desc="Déjanos tu email y los datos básicos de tu negocio."
            />
            <Step
              title="Revisión rápida"
              desc="Revisamos tu ficha y volumen de reseñas para asegurar buen encaje."
            />
            <Step
              title="Activa Aliigo"
              desc="Recibes un código de activación con condiciones especiales de lanzamiento."
            />
          </ol>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Precios de lanzamiento
              </h2>
              <p className="mt-2 text-zinc-300">
                Estamos definiendo la estructura final de precios. Los negocios
                que entren en la beta tendrán condiciones preferentes, sin
                permanencia y con un precio de entrada desde{" "}
                <span className="font-semibold text-zinc-100">49 €/mes</span>.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                <li>• Plan sencillo para una o pocas ubicaciones</li>
                <li>
                  • Incluye chat web y solicitudes de reseñas (WhatsApp Business
                  en desarrollo)
                </li>
                <li>
                  • Resumen básico de reputación, con IA en pruebas dentro de la
                  beta
                </li>
                <li>• Sin permanencia, cancelación en cualquier momento</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-100"
                >
                  Quiero ser parte de la beta
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/50">
              <p className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
                Referencia de rango
              </p>
              <p className="text-5xl font-extrabold text-white">
                49€
                <span className="text-2xl align-top">/mes</span>
              </p>
              <p className="mt-2 text-zinc-400 text-sm">
                Precio de referencia para negocios locales con 1–3 ubicaciones.
                Ajustaremos el precio final según volumen de mensajes, canales y
                número de sedes.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-800 p-3">
                  1 usuario incluido
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  Soporte por email
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  Reportes básicos
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  API conversacional (beta)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-white">
            Preguntas frecuentes
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Faq
              q="¿Qué hace exactamente Aliigo?"
              a="Aliigo combina un widget de chat con IA para tu web, un buzón para gestionar las conversaciones y un panel para ver mejor tus reseñas de Google. La idea es que tengas en un solo sitio lo que hoy está repartido entre varias herramientas."
            />

            <Faq
              q="¿Qué funciones están disponibles en la beta?"
              a="Empezamos con el widget de chat en tu web con el asistente con IA, el buzón de conversaciones y un panel básico para tus reseñas de Google. Durante la beta iremos activando, de forma progresiva más automatizaciones según el tipo de negocio."
            />

            <Faq
              q="¿Quién configura el widget y el asistente con IA?"
              a="Tú decides qué quiere decir el asistente: servicios, horarios, preguntas frecuentes, etc. Desde Aliigo te damos plantillas y un checklist sencillo. Instalar el widget es copiar y pegar un pequeño código en tu web (o se lo envías a tu desarrollador)."
            />

            <Faq
              q="¿Hay compromiso de permanencia?"
              a="No. Queremos que sigas en Aliigo porque te aporta clientes y claridad, no por un contrato. Podrás cancelar cuando quieras desde el propio panel."
            />

            <Faq
              q="¿Necesito tarjeta para solicitar invitación?"
              a="No. Para pedir invitación solo necesitamos tus datos básicos. Si eres aceptado en la beta, te explicaremos las condiciones y, solo entonces, decidirás si activas el plan de pago."
            />

            <Faq
              q="¿Cómo pido ayuda si me bloqueo?"
              a="Durante la beta tendrás soporte por email y un pequeño widget de ayuda dentro del panel para contactarnos. Si en algún punto te atascas con la configuración, te guiamos para que puedas dejarlo funcionando sin complicaciones."
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Da a tu reputación el sitio que merece
          </h2>
          <p className="mt-3 text-zinc-300">
            Apúntate a la beta privada de Aliigo y sé de los primeros en probar
            el panel que une reseñas, chat y reputación en un solo lugar.
          </p>
          <div className="mt-7">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-100"
            >
              Solicitar invitación
            </Link>
          </div>
        </div>
      </section>

      {/* Aliigo help widget (client) */}
      <AliigoSupportWidget />
    </>
  );
}

function Feature({
  n,
  title,
  desc,
  bullets,
}: {
  n: number;
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div
            className="h-8 w-8 flex items-center justify-center
            rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium"
          >
            {n}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-zinc-300 text-sm">{desc}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-zinc-400">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}

function Step({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="rounded-2xl border border-zinc-800 p-6 bg-zinc-900/40 flex gap-4 min-h-[160px]">
      {/* Arrow */}
      <div className="text-3xl leading-none text-zinc-500 flex-shrink-0 mt-1">
        →
      </div>

      {/* Text */}
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-300">{desc}</p>
      </div>
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
