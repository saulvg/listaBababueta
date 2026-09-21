import { ApiError, jsonError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { grantListAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { clientIp, enforceRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { listAccessSchema } from '@/lib/validations/list'

// POST /api/public/lists/[slug]/access — un familiar mete la clave.
//
// Este es el endpoint más expuesto de la app: la clave la elige una persona
// para dictarla por teléfono, así que puede ser corta (CLAUDE.md §6). Lo que
// la protege no es su entropía, es este rate limiting.

type Contexto = { params: Promise<{ slug: string }> }

/** Contra el que insiste en una lista concreta. */
const POR_LISTA = { limit: 10, windowMs: 10 * 60 * 1000 }
/** Contra el que va probando lista por lista para esquivar el límite anterior. */
const POR_IP = { limit: 30, windowMs: 10 * 60 * 1000 }

export const POST = route<Contexto>(async (request, { params }) => {
  const { slug } = await params
  const ip = clientIp(request)
  const clavePorLista = `access:${ip}:${slug}`

  enforceRateLimit({ key: clavePorLista, ...POR_LISTA })
  enforceRateLimit({ key: `access:${ip}`, ...POR_IP })

  const { accessKey } = await parseBody(request, listAccessSchema)

  const lista = await prisma.list.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      shippingAddress: true,
      accessKey: true,
    },
  })

  if (!lista) {
    throw new ApiError(404, 'list_not_found', 'Esa lista no existe.')
  }

  // Comparación exacta, salvo espacios sobrantes (los dos lados vienen ya
  // recortados por Zod). Distingue mayúsculas: si la familia se queja de eso,
  // el cambio es un .toLowerCase() en los dos lados, no un caso especial.
  if (lista.accessKey.trim() !== accessKey) {
    return jsonError(401, 'invalid_access_key', 'La clave no es correcta.')
  }

  await grantListAccess(lista.id)
  resetRateLimit(clavePorLista)

  // Se devuelve la lista sin la clave, campo a campo: aquí no vale un
  // `...lista` menos accessKey, porque el día que el select crezca el olvido
  // se publica solo.
  return jsonOk({
    list: {
      id: lista.id,
      title: lista.title,
      slug: lista.slug,
      shippingAddress: lista.shippingAddress,
    },
  })
})
