import { jsonError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { verificarCredenciales } from '@/lib/auth/parents'
import { getParentSession } from '@/lib/auth/session'
import { clientIp, enforceRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validations/auth'

// POST /api/auth/login — entrada al panel de los padres.

/** 8 intentos cada 5 minutos por IP (CLAUDE.md §6). */
const LIMITE = { limit: 8, windowMs: 5 * 60 * 1000 }

export const POST = route(async (request) => {
  const clave = `login:${clientIp(request)}`

  // El límite se comprueba ANTES de validar y de hashear: así una ráfaga de
  // peticiones no nos hace quemar CPU en bcrypt, que es lo caro de este
  // endpoint.
  enforceRateLimit({ key: clave, ...LIMITE })

  const { email, password } = await parseBody(request, loginSchema)
  const cuenta = await verificarCredenciales(email, password)

  if (!cuenta) {
    // Un solo mensaje para email inexistente y contraseña mala: decir cuál de
    // los dos ha fallado es regalarle al de enfrente la mitad del trabajo.
    return jsonError(
      401,
      'invalid_credentials',
      'Email o contraseña incorrectos.',
    )
  }

  const sesion = await getParentSession()
  sesion.email = cuenta.email
  await sesion.save()

  // Quien acierta deja de arrastrar los fallos anteriores.
  resetRateLimit(clave)

  return jsonOk({ parent: { email: cuenta.email } })
})
