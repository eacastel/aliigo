"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/config";

export default function SignupPage() {
  const router = useRouter();
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/app/dashboard`,
        },
      }
    );

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (signUpData.user?.confirmation_sent_at) {
      setConfirmationNotice(true);
      return;
    }

    // user confirmed immediately → insert into DB
    const userId = signUpData.user?.id;
    if (!userId) {
      setError("No se pudo obtener el ID del usuario.");
      return;
    }

    const { error: insertError } = await supabase
      .from("business_profiles")
      .insert([
        {
          id: userId,
          nombre_negocio: nombreNegocio,
          nombre_contacto: nombreContacto,
          telefono,
        },
      ]);

    if (insertError) {
      setError("Error al guardar la información del negocio.");
      return;
    }

    // Redirect to dashboard
    router.push("/app/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      {confirmationNotice && (
        <p className="bg-green-100 text-green-800 p-4 rounded mb-4 text-center">
          ✉️ Te hemos enviado un correo de confirmación. Por favor, revisa tu
          bandeja de entrada para activar tu cuenta.
        </p>
      )}
      <h1 className="text-2xl font-bold mb-6 text-center">
        Crear cuenta en Aliigo
      </h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nombre del negocio"
          value={nombreNegocio}
          onChange={(e) => setNombreNegocio(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          placeholder="Tu nombre"
          value={nombreContacto}
          onChange={(e) => setNombreContacto(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          placeholder="Número de teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border px-4 py-2 rounded"
        />

        <button
          onClick={handleSignup}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
