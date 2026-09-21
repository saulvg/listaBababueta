'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import { Field } from '@/components/field'
import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, mensajeDeError } from '@/lib/api/client'
import type { SessionResponse } from '@/lib/api/types'
import { erroresDeApi, erroresDeZod, type ErroresDeCampo } from '@/lib/forms'
import { useApi } from '@/lib/hooks/use-api'
import { loginSchema } from '@/lib/validations/auth'

// Entrada al panel. No hay registro ni "he olvidado mi contraseña": las dos
// cuentas son fijas y viven en variables de entorno (CLAUDE.md §5).
export default function EntrarPage() {
  const router = useRouter()
  const { datos: sesion } = useApi<SessionResponse>('/api/auth/session')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [errores, setErrores] = useState<ErroresDeCampo>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Con la sesión ya abierta, esta pantalla no pinta nada.
  useEffect(() => {
    if (sesion?.parent) router.replace('/panel')
  }, [sesion, router])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()

    const validacion = loginSchema.safeParse({ email, password })

    if (!validacion.success) {
      setErrores(erroresDeZod(validacion.error))
      setError(null)
      return
    }

    setErrores({})
    setError(null)
    setEnviando(true)

    try {
      await api.post('/api/auth/login', validacion.data)
      router.replace('/panel')
    } catch (fallo) {
      // Credenciales malas (401) y demasiados intentos (429) se cuentan
      // igual: con el mensaje que manda el servidor, que ya está escrito
      // para que lo lea una persona.
      setError(mensajeDeError(fallo))
      setErrores(erroresDeApi(fallo))
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-24 sm:px-6">
      <div className="space-y-6 rounded-2xl border bg-card p-6">
        <div className="space-y-1">
          <h1 className="text-2xl">Panel de gestión</h1>
          <p className="text-sm text-muted-foreground">
            Acceso solo para los padres.
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <Field label="Correo" error={errores.email}>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="nombre@correo.com"
                autoComplete="email"
                autoFocus
              />
            )}
          </Field>

          <Field label="Contraseña" error={errores.password}>
            {(props) => (
              <div className="relative">
                <Input
                  {...props}
                  type={verClave ? 'text' : 'password'}
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  autoComplete="current-password"
                  // Hueco para el ojo, que va encima del campo.
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setVerClave((visible) => !visible)}
                  // La etiqueta dice lo que va a pasar al pulsar, no el estado
                  // actual: es lo que espera quien usa un lector de pantalla.
                  aria-label={
                    verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'
                  }
                  aria-pressed={verClave}
                  title={verClave ? 'Ocultar' : 'Mostrar'}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {verClave ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
            )}
          </Field>

          {error ? <Notice>{error}</Notice> : null}

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={enviando}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
