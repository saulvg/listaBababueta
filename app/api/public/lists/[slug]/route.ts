import { ApiError, jsonOk } from '@/lib/api/responses'
import { route } from '@/lib/api/route'
import { requireListAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { findListBySlug } from '@/lib/lists/queries'

// GET /api/public/lists/[slug] — la lista que ve la familia.
//
// Devuelve `purchasedBy` a propósito: saber que "la tía Carmen ya compró el
// triciclo" es justo lo que evita la compra repetida, que es para lo que
// existe la app. Lo que no sale de aquí nunca es `accessKey`.

type Contexto = { params: Promise<{ slug: string }> }

export const GET = route<Contexto>(async (_request, { params }) => {
  const { slug } = await params

  const lista = await findListBySlug(slug)

  if (!lista) {
    throw new ApiError(404, 'list_not_found', 'Esa lista no existe.')
  }

  // 403 con el código `list_locked`: la UI lo usa para enseñar el formulario
  // de la clave en vez de una página de error.
  await requireListAccess(lista.id)

  const productos = await prisma.product.findMany({
    where: { listId: lista.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      url: true,
      priceCents: true,
      comment: true,
      imageUrl: true,
      status: true,
      purchasedBy: true,
      purchasedAt: true,
    },
  })

  return jsonOk({ list: lista, products: productos })
})
