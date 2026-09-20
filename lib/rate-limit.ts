import { ApiError } from '@/lib/api/responses'

// Rate limiting con un contador en memoria y ventana fija. Nada de Redis
// (CLAUDE.md §8): esto es una lista de regalos de una familia, no un sitio con
// tráfico.
//
// Lo que SÍ conviene tener claro de esta decisión: en Vercel cada instancia
// tiene su propio Map y se vacía en cada arranque en frío. Frena al que prueba
// claves a mano o con un bucle tonto, que es el riesgo real aquí, pero no a un
// ataque repartido entre muchas peticiones simultáneas. Si algún día hiciera
// falta de verdad, el sustituto es una tabla en Postgres con un upsert
// atómico, no un Redis.

type Ventana = {
  /** Instante (epoch ms) en que la ventana caduca. */
  caducaEn: number
  intentos: number
}

// Igual que el cliente de Prisma: sobrevive al hot reload de desarrollo, que
// si no reiniciaría el contador con cada cambio de fichero.
const globalParaLimites = globalThis as unknown as {
  rateLimitVentanas: Map<string, Ventana> | undefined
}

const ventanas = (globalParaLimites.rateLimitVentanas ??= new Map())

/** A partir de aquí se hace limpieza de ventanas caducadas al escribir. */
const UMBRAL_DE_LIMPIEZA = 500

function limpiarCaducadas(ahora: number): void {
  for (const [clave, ventana] of ventanas) {
    if (ventana.caducaEn <= ahora) ventanas.delete(clave)
  }
}

export type RateLimitOptions = {
  /** Identifica el contador. Convención: `<ámbito>:<ip>[:<recurso>]`. */
  key: string
  /** Intentos permitidos dentro de la ventana. */
  limit: number
  windowMs: number
}

export type RateLimitResult =
  { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number }

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const ahora = Date.now()
  const ventana = ventanas.get(key)

  if (!ventana || ventana.caducaEn <= ahora) {
    if (ventanas.size > UMBRAL_DE_LIMPIEZA) limpiarCaducadas(ahora)
    ventanas.set(key, { caducaEn: ahora + windowMs, intentos: 1 })
    return { ok: true, remaining: limit - 1 }
  }

  ventana.intentos += 1

  if (ventana.intentos > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((ventana.caducaEn - ahora) / 1000),
      ),
    }
  }

  return { ok: true, remaining: limit - ventana.intentos }
}

/**
 * Borra el contador. Se llama cuando el intento sale bien: quien acierta la
 * clave a la tercera no debería arrastrar el castigo de los dos fallos.
 */
export function resetRateLimit(key: string): void {
  ventanas.delete(key)
}

/** Igual que checkRateLimit, pero cortando con un 429 si se pasa del límite. */
export function enforceRateLimit(opciones: RateLimitOptions): void {
  const resultado = checkRateLimit(opciones)

  if (resultado.ok) return

  throw new ApiError(
    429,
    'rate_limited',
    `Demasiados intentos. Prueba otra vez en ${resultado.retryAfterSeconds} segundos.`,
    { 'Retry-After': String(resultado.retryAfterSeconds) },
  )
}

/**
 * IP de quien llama. Detrás del proxy de Vercel la IP real es la primera de
 * `x-forwarded-for`; `request.ip` ahí sería siempre la del proxy.
 *
 * Esta cabecera se puede falsear cuando la app corre sin proxy delante, así
 * que no vale como identidad — solo como agrupador para contar intentos.
 */
export function clientIp(request: Request): string {
  const reenviada = request.headers.get('x-forwarded-for')
  if (reenviada) {
    const primera = reenviada.split(',')[0]?.trim()
    if (primera) return primera
  }

  return request.headers.get('x-real-ip')?.trim() || 'desconocida'
}
