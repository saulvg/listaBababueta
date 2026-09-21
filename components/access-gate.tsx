'use client'

import { Gift } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Field } from '@/components/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, mensajeDeError } from '@/lib/api/client'
import type { AccessResponse, ListsResponse } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'
import { listAccessSchema } from '@/lib/validations/list'

/**
 * Pantalla de la clave de una lista. Sale cuando la API contesta 403
 * `list_locked`, tanto al abrir la lista como al abrir un regalo suelto desde
 * un enlace compartido — por eso vive aquí y no dentro de una de las dos.
 *
 * El título sale del índice público de listas, que no pide clave: los títulos
 * son públicos a propósito (CLAUDE.md §5), y así quien llega ve en qué lista
 * está metiendo la clave en vez de en una pantalla anónima.
 */
export function AccessGate({
  slug,
  onUnlocked,
}: {
  slug: string
  onUnlocked: () => void
}) {
  const { datos } = useApi<ListsResponse>('/api/public/lists')
  const titulo = datos?.lists.find((lista) => lista.slug === slug)?.title

  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()

    // El mismo esquema que valida el servidor: aquí solo sirve para no gastar
    // un intento del rate limiting con un campo vacío.
    const validacion = listAccessSchema.safeParse({ accessKey: clave })

    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Escribe la clave.')
      return
    }

    setError(null)
    setEnviando(true)

    try {
      await api.post<AccessResponse>(
        `/api/public/lists/${encodeURIComponent(slug)}/access`,
        validacion.data,
      )
      onUnlocked()
    } catch (fallo) {
      // Sirve igual para la clave incorrecta (401), para el "demasiados
      // intentos" (429) y para la lista que ya no existe (404): los tres
      // traen un mensaje escrito para la persona.
      setError(mensajeDeError(fallo))
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border bg-card p-6 text-center">
      <div className="space-y-3">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Gift className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl">{titulo ?? 'Lista privada'}</h1>
        <p className="text-sm text-muted-foreground">
          Introduce la clave que te compartimos para ver la lista.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-3 text-left">
        <Field label="Clave de acceso" error={error ?? undefined}>
          {(props) => (
            <Input
              {...props}
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
              placeholder="Clave de acceso"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              // En el móvil, que la primera letra no se ponga en mayúscula
              // sola: la clave distingue mayúsculas.
              spellCheck={false}
              autoFocus
            />
          )}
        </Field>

        <Button type="submit" size="xl" className="w-full" disabled={enviando}>
          {enviando ? 'Comprobando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
