export default function CheckEmailPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Gracias por crear tu cuenta en Aliigo
        </h1>
        <p className="mt-4 text-sm text-zinc-300">
          Hemos recibido tus datos. Durante esta fase de beta privada revisamos
          cada alta de forma manual.
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          Si tu negocio encaja con el programa de lanzamiento, te enviaremos un
          email con:
        </p>
        <ul className="mt-3 text-sm text-zinc-300 list-disc list-inside space-y-1">
          <li>Confirmación de activación</li>
          <li>Instrucciones para acceder al panel</li>
          <li>Condiciones especiales de lanzamiento</li>
        </ul>
        <p className="mt-5 text-xs text-zinc-500">
          Si te has equivocado de email, puedes volver atrás y registrarte de
          nuevo con la dirección correcta.
        </p>
      </div>
    </main>
  );
}
