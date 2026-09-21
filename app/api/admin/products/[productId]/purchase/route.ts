import { ApiError, jsonError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  markProductAsPurchased,
  unmarkProductAsPurchased,
} from '@/lib/products/purchase'
import { purchaseProductSchema } from '@/lib/validations/product'

// /api/admin/products/[productId]/purchase — los padres marcan y desmarcan.
//
// POST   marca como comprado (lo compraron ellos, o se lo dijeron por teléfono)
// DELETE lo devuelve a disponible (se marcó por error)
//
// Por qué un endpoint aparte y no un campo más en el PATCH de producto: la
// regla del proyecto es que el estado solo se escriba desde
// lib/products/purchase.ts (CLAUDE.md §5). Un PATCH que aceptara `status`
// dejaría dos caminos para lo mismo, y el segundo se saltaría la garantía
// contra la doble compra. Aquí se llama a las mismas funciones que usa la
// familia, con la misma actualización condicional.
//
// Lo que sí cambia respecto del endpoint público: no se avisa por email. El
// aviso existe para contarles a los padres que alguien ha comprado algo, y
// mandárselo cuando lo han marcado ellos mismos es escribirles para contarles
// lo que acaban de hacer.

type Contexto = { params: Promise<{ productId: string }> }

const NO_EXISTE = new ApiError(
  404,
  'product_not_found',
  'Ese regalo no existe.',
)

export const POST = route<Contexto>(async (request, { params }) => {
  await requireParent()

  const { productId } = await params
  const { purchasedBy } = await parseBody(request, purchaseProductSchema)

  const resultado = await markProductAsPurchased(prisma, {
    productId,
    purchasedBy,
  })

  if (!resultado.ok) {
    if (resultado.reason === 'not_found') throw NO_EXISTE

    // Un familiar se ha adelantado mientras el diálogo estaba abierto.
    return jsonError(
      409,
      'already_purchased',
      'Este regalo ya estaba marcado como comprado.',
    )
  }

  return jsonOk({
    product: {
      id: productId,
      status: 'COMPRADO' as const,
      purchasedBy: resultado.purchasedBy,
      purchasedAt: resultado.purchasedAt,
    },
  })
})

export const DELETE = route<Contexto>(async (_request, { params }) => {
  await requireParent()

  const { productId } = await params
  const resultado = await unmarkProductAsPurchased(prisma, { productId })

  if (!resultado.ok) {
    if (resultado.reason === 'not_found') throw NO_EXISTE

    // Ya estaba disponible: alguien lo desmarcó antes, o se pulsó dos veces.
    return jsonError(409, 'not_purchased', 'Este regalo ya estaba sin comprar.')
  }

  return jsonOk({
    product: {
      id: productId,
      status: 'DISPONIBLE' as const,
      purchasedBy: null,
      purchasedAt: null,
    },
  })
})
