import type { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ApiError, jsonError } from '@/lib/api/responses'

// Envoltorio común de los Route Handlers. Sin esto, cada handler repetiría el
// mismo try/catch de doce líneas y antes o después uno se quedaría sin él,
// devolviendo un stack trace de Postgres a la familia.

type Handler<Ctx> = (
  request: NextRequest,
  context: Ctx,
) => Promise<NextResponse | Response>

export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      // Cortes deliberados (401, 403, 404…): ya traen su respuesta hecha.
      if (error instanceof ApiError) {
        return error.toResponse()
      }

      // Datos que no pasan el esquema. 422 y no 400: el JSON estaba bien
      // formado, lo que falla es el contenido.
      if (error instanceof z.ZodError) {
        const { formErrors, fieldErrors } = z.flattenError(error)

        return jsonError(
          422,
          'validation_error',
          // Los errores de objeto entero (los `.refine()` del esquema, como
          // "No hay nada que actualizar") no tienen campo al que colgarse, así
          // que se quedarían mudos si no se subieran aquí.
          formErrors[0] ?? 'Revisa los datos del formulario.',
          fieldErrors as Record<string, string[]>,
        )
      }

      // Cualquier otra cosa es un fallo nuestro: se registra entero en el
      // servidor y hacia fuera sale un mensaje genérico.
      console.error(
        `[api] ${request.method} ${request.nextUrl.pathname}`,
        error,
      )

      return jsonError(
        500,
        'internal_error',
        'Algo ha ido mal por nuestra parte. Inténtalo de nuevo.',
      )
    }
  }
}

/**
 * Lee y valida el cuerpo JSON de la petición.
 *
 * Trata el cuerpo vacío como `{}` a propósito: hay peticiones cuyos campos son
 * todos opcionales (marcar un regalo como comprado de forma anónima) y
 * obligar a mandar `{}` a mano sería una trampa tonta para el cliente.
 */
export async function parseBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  const texto = await request.text()

  if (texto.trim() === '') {
    return schema.parse({})
  }

  let crudo: unknown
  try {
    crudo = JSON.parse(texto)
  } catch {
    throw new ApiError(
      400,
      'invalid_json',
      'El cuerpo de la petición no es JSON válido.',
    )
  }

  return schema.parse(crudo)
}
