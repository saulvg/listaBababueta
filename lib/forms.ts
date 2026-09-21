import type { z } from 'zod'

import { ApiClientError } from '@/lib/api/client'

// Los formularios se validan dos veces: en el navegador con el esquema de Zod
// (para no mandar una petición que va a fallar) y en el servidor, que es la
// que cuenta. Los dos sitios devuelven lo mismo — errores por campo — pero en
// formatos distintos, así que aquí se aplanan al que usa la pantalla:
// un mensaje por campo, el primero.

export type ErroresDeCampo = Record<string, string>

function primeros(
  errores: Record<string, string[] | undefined>,
): ErroresDeCampo {
  return Object.fromEntries(
    Object.entries(errores)
      .map(([campo, mensajes]) => [campo, mensajes?.[0]])
      .filter(([, mensaje]) => Boolean(mensaje)) as [string, string][],
  )
}

/** Errores de una validación de Zod hecha en el navegador. */
export function erroresDeZod(error: z.ZodError): ErroresDeCampo {
  const porCampo: Record<string, string[]> = {}

  for (const incidencia of error.issues) {
    const campo = incidencia.path[0]
    if (typeof campo !== 'string') continue
    ;(porCampo[campo] ??= []).push(incidencia.message)
  }

  return primeros(porCampo)
}

/** Errores de un 422 del servidor, que viajan en `details`. */
export function erroresDeApi(error: unknown): ErroresDeCampo {
  if (!(error instanceof ApiClientError) || !error.details) return {}
  return primeros(error.details)
}
