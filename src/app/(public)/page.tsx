import Link from "next/link";
import Image from "next/image";
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
                Reputación y conversaciones en un solo lugar.
              </h1>
              <p className="mt-5 text-lg text-zinc-300">
                Aliigo te ayuda a conseguir más reseñas, responder más rápido y
                convertir mejor, con un panel sencillo y automatizaciones listas
                para clínicas, comercios y servicios locales.
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
                Estamos en beta privada. Seleccionamos unos pocos negocios cada
                mes y les damos condiciones de lanzamiento desde{" "}
                <span className="font-semibold text-zinc-200">49 €/mes</span>.
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-2xl">
                <Image
                  src="/aliigo-dashboard-mock.svg"
                  alt="Panel de Aliigo con bandeja de entrada, reseñas y métricas"
                  width={1200}
                  height={720}
                  className="w-full h-auto rounded-xl"
                  priority
                />
              </div>
              <div className="pointer-events-none absolute -inset-4 -z-10 bg-[radial-gradient(40%_40%_at_70%_30%,rgba(59,130,246,0.25),transparent_60%)]" />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF (placeholder) */}
      <section className="bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-center text-sm text-zinc-400">
            Diseñado para clínicas, comercios y servicios locales que viven de
            su reputación.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Medicina estética */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/clinica-estetica.png"
                  alt="Profesional de medicina estética atendiendo a una paciente"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">Medicina estética</span>
            </div>

            {/* Clínica veterinaria */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/clinica-veterinaria.png"
                  alt="Veterinaria atendiendo a un perro en clínica"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">Clínica veterinaria</span>
            </div>

            {/* Escuelas privadas */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/escuelas-privadas.png"
                  alt="Profesora en una escuela privada"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">Escuelas privadas</span>
            </div>

            {/* Fisioterapia */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/fisioterapia.png"
                  alt="Profesional de fisioterapia atendiendo a un paciente"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">Fisioterapia</span>
            </div>

            {/* Servicios de construcción */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/servicios-construccion.png"
                  alt="Técnico de construcción revisando un proyecto"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">
                Servicios de construcción
              </span>
            </div>

            {/* Taller mecánico */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/taller-mecanico.png"
                  alt="Mecánico trabajando en un vehículo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-zinc-300">Taller mecánico</span>
            </div>
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
              Enfocado en lo que mueve la aguja: reseñas, mensajes y tiempo de
              respuesta. Menos menús, más resultados.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Feature
              title="Solicitudes de reseñas"
              desc="Envía invitaciones por SMS o WhatsApp y consigue reseñas reales en los sitios que importan."
              bullets={[
                "Enlaces directos a Google / Facebook",
                "Recordatorios automáticos",
                "Plantillas con el tono de tu marca",
              ]}
            />
            <Feature
              title="Chat unificado"
              desc="Conversa desde web y WhatsApp en un solo buzón. No más pestañas abiertas por todas partes."
              bullets={[
                "Widget web instalable en 2 minutos",
                "WhatsApp Business (API o bridging)",
                "Historial, etiquetas y notas internas",
              ]}
            />
            <Feature
              title="Resumen de reputación"
              desc="Tus reseñas, resumidas cada semana con insights accionables para el equipo."
              bullets={[
                "Detección de tendencias y caídas",
                "Análisis de sentimiento",
                "Acciones sugeridas para mejorar",
              ]}
            />
            <Feature
              title="Directorios y NAP"
              desc="Nombre, dirección y teléfono coherentes en los principales directorios."
              bullets={[
                "Google / Bing / Apple / FB",
                "Sync básico programado",
                "Control desde el panel de Aliigo",
              ]}
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
              Estamos en beta privada. El proceso es simple: te apuntas, te
              revisamos y, si encaja, te activamos.
            </p>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              n={1}
              title="Solicita invitación"
              desc="Déjanos tu email y los datos básicos de tu negocio."
            />
            <Step
              n={2}
              title="Revisión rápida"
              desc="Revisamos tu ficha y volumen de reseñas para asegurar buen encaje."
            />
            <Step
              n={3}
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
                <li>• Incluye chat web + WhatsApp y solicitudes de reseñas</li>
                <li>• Resumen de reputación por IA</li>
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
                  Usuarios incluidos
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  Soporte por email
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  Reportes básicos
                </div>
                <div className="rounded-lg border border-zinc-800 p-3">
                  API conversacional
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
              q="¿Aliigo está disponible para cualquiera?"
              a="Durante el lanzamiento estamos en beta privada. Priorizamos negocios locales que ya reciben consultas o reseñas y quieren profesionalizar su reputación."
            />
            <Faq
              q="¿Tiene compromiso de permanencia?"
              a="No. Queremos que sigas en Aliigo porque te funciona, no por contrato. Podrás cancelar cuando quieras."
            />
            <Faq
              q="¿Necesito tarjeta para entrar en la beta?"
              a="No para solicitar invitación. Si eres aceptado, te explicaremos condiciones y pasos antes de activar el plan."
            />
            <Faq
              q="¿Quién configura todo esto?"
              a="Te guiamos en la configuración inicial de canales y mensajes. El objetivo es dejarlo funcionando en poco tiempo sin que tengas que volverte loco."
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
