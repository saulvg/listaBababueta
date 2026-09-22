import { after } from 'next/server'

import { ApiError, jsonError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireListAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { enviarAvisoDeCompra } from '@/lib/email/purchase-notification'
import { esVisible } from '@/lib/lists/queries'
import { markProductAsPurchased } from '@/lib/products/purchase'
import { purchaseProductSchema } from '@/lib/validations/product'

// POST /api/public/products/[productId]/purchase — "yo me encargo de este".
//
// La garantía contra la doble compra NO está aquí: está en
// markProductAsPurchased(), ya probada contra una base real (CLAUDE.md §5).
// Este handler solo hace de traductor a HTTP:
//
//   not_found         -> 404 (el regalo ya no está en la lista)
//   already_purchased -> 409 (alguien se ha adelantado)

type Contexto = { params: Promise<{ productId: string }> }

export const POST = route<Contexto>(async (request, { params }) => {
  const { productId } = await params
  const { purchasedBy } = await parseBody(request, purchaseProductSchema)

  const producto = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      list: { select: { id: true, title: true, slug: true, hidden: true } },
    },
  })

  // Una lista oculta no se puede leer (ver el GET de al lado) ni tampoco
  // escribir. No basta con que la pantalla no se pinte: la URL de un regalo se
  // queda guardada en la conversación de WhatsApp, y un POST a mano desde ahí
  // dejaría marcas de compra en una lista que los padres ya habían archivado.
  if (!producto || !(await esVisible(producto.list))) {
    throw new ApiError(
      404,
      'product_not_found',
      'Ese regalo ya no está en la lista.',
    )
  }

  // Comprar exige haber desbloqueado la lista de ESE producto: sin esto, con
  // el id de un producto se podría marcar como comprado en una lista cuya
  // clave no se conoce.
  await requireListAccess(producto.list.id)

  const resultado = await markProductAsPurchased(prisma, {
    productId,
    purchasedBy,
  })

  if (!resultado.ok) {
    if (resultado.reason === 'not_found') {
      // Entre la lectura de arriba y el UPDATE, los padres lo han borrado.
      throw new ApiError(
        404,
        'product_not_found',
        'Ese regalo ya no está en la lista.',
      )
    }

    return jsonError(
      409,
      'already_purchased',
      'Alguien se te ha adelantado: este regalo ya está comprado.',
    )
  }

  // El aviso sale DESPUÉS de responder: la compra ya está guardada y quien la
  // hizo no tiene por qué esperar a que Resend conteste. `after()` es lo que
  // en Vercel mantiene la función viva hasta que el envío termina — un
  // `void promesa` a secas se quedaría a medias al congelarse la instancia.
  after(async () => {
    await enviarAvisoDeCompra({
      listTitle: producto.list.title,
      listSlug: producto.list.slug,
      productTitle: producto.title,
      purchasedBy: resultado.purchasedBy,
    })
  })

  return jsonOk({
    product: {
      id: producto.id,
      status: 'COMPRADO' as const,
      purchasedBy: resultado.purchasedBy,
      purchasedAt: resultado.purchasedAt,
    },
  })
})
