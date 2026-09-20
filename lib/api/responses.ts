import { NextResponse } from 'next/server'

// Formato único de respuesta de toda la API, para que el frontend tenga un
// solo sitio donde mirar:
//
//   éxito -> el objeto tal cual            { "list": { ... } }
//   error -> siempre bajo la clave `error` { "error": { "code": "...", ... } }
//
// El `code` es para el código (un switch), el `message` es para la persona.

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    /** Errores campo a campo de Zod, cuando los hay. */
    details?: Record<string, string[]>
  }
}

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
  headers?: HeadersInit,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers },
  )
}

/**
 * Error con respuesta HTTP propia. Lo lanzan las guardas de sesión y los
 * handlers cuando quieren cortar sin arrastrar el `return` por media función;
 * `route()` (ver lib/api/route.ts) lo convierte en la respuesta de vuelta.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly headers?: HeadersInit,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toResponse(): NextResponse<ApiErrorBody> {
    return jsonError(
      this.status,
      this.code,
      this.message,
      undefined,
      this.headers,
    )
  }
}
