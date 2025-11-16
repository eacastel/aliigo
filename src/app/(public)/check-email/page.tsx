"use client";

import { useState } from "react";

export default function SignupWaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          businessName,
          website,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Algo salió mal");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
      setName("");
      setBusinessName("");
      setWebsite("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setErrorMessage("No se pudo enviar el formulario");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Solicitar invitación a Aliigo
        </h1>
        <p className="mt-3 text-zinc-300 text-sm">
          Durante el lanzamiento, Aliigo está disponible solo por invitación.
          Cuéntanos un poco sobre tu negocio y te enviaremos un código de
          activación si encaja con el programa.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Email de contacto *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Tu nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Nombre del negocio
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Web o ficha de Google
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200">
              Comentarios (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{errorMessage}</p>
          )}
          {status === "success" && (
            <p className="text-sm text-emerald-400">
              Gracias. Hemos recibido tu solicitud. Si encaja con el programa de
              lanzamiento, te enviaremos un código de activación por email.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60"
          >
            {status === "loading" ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-500">
          Usaremos tus datos solo para ponernos en contacto sobre Aliigo. Nada
          de spam.
        </p>
      </div>
    </main>
  );
}
