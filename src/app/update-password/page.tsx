'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Establecer nueva contraseña</h1>

      {success ? (
        <p className="bg-green-100 text-green-800 p-4 rounded text-center">
          ✅ Tu contraseña se ha actualizado. Redirigiendo al login...
        </p>
      ) : (
        <>
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded mb-4"
          />

          <button
            onClick={handleUpdate}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Guardar nueva contraseña
          </button>
        </>
      )}
    </div>
  )
}
