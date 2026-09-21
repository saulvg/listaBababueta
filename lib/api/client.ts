import type { ApiErrorBody } from '@/lib/api/responses'

// El espejo en el navegador de lib/api/responses.ts.
//
// El servidor promete un único formato de error — { error: { code, message } }
// — y este fichero es el único sitio de la interfaz que lo desenvuelve. Si
// cada pantalla hiciera su propio `res.json()` y su propio `if (!res.ok)`,
// antes o después una se olvidaría de mirar el `code` y enseñaría "Error 403"
// donde tocaba pedir la clave de la lista.

/** Un error que la API ha contado bien: trae código y mensaje para la persona. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Errores campo a campo de Zod, cuando el fallo es de validación. */
    readonly details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/** ¿Este error es el que esperábamos? `esCodigo(error, 'list_locked')`. */
export function esCodigo(error: unknown, ...codigos: string[]): boolean {
  return error instanceof ApiClientError && codigos.includes(error.code)
}

/**
 * Mensaje que se le puede enseñar a la persona. Cualquier error que no venga
 * de la API (un fallo de JavaScript, por ejemplo) se traduce a algo genérico
 * en vez de soltar su texto en pantalla.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  return 'Algo ha ido mal. Inténtalo de nuevo.'
}

const CABECERAS_JSON = { 'Content-Type': 'application/json' }

async function peticion<T>(
  metodo: string,
  ruta: string,
  cuerpo?: unknown,
): Promise<T> {
  let respuesta: Response

  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      // Sin esto el navegador puede servir un GET de su caché y enseñar una
      // lista sin el regalo que se acaba de comprar.
      cache: 'no-store',
      ...(cuerpo === undefined
        ? {}
        : { headers: CABECERAS_JSON, body: JSON.stringify(cuerpo) }),
    })
  } catch {
    // Ni siquiera hemos llegado al servidor: móvil sin cobertura, túnel, etc.
    throw new ApiClientError(
      0,
      'network_error',
      'No hemos podido conectar. Comprueba tu conexión e inténtalo otra vez.',
    )
  }

  // 204 y compañía: no hay cuerpo que leer.
  const texto = await respuesta.text()
  let datos: unknown = null

  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (respuesta.ok) return datos as T

  // Un error nuestro siempre trae el sobre. Si no lo trae, es que la respuesta
  // no ha salido de la API (una página de error del hosting, por ejemplo).
  const sobre = datos as ApiErrorBody | null

  if (sobre?.error?.code) {
    throw new ApiClientError(
      respuesta.status,
      sobre.error.code,
      sobre.error.message,
      sobre.error.details,
    )
  }

  throw new ApiClientError(
    respuesta.status,
    'unexpected_response',
    'Algo ha ido mal por nuestra parte. Inténtalo de nuevo.',
  )
}

export const api = {
  get: <T>(ruta: string) => peticion<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    peticion<T>('POST', ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo: unknown) =>
    peticion<T>('PATCH', ruta, cuerpo),
  delete: <T>(ruta: string) => peticion<T>('DELETE', ruta),
}
