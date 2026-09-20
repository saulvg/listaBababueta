import { ApiError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { createProductSchema } from '@/lib/validations/product'

// /api/admin/lists/[listId]/products — productos de una lista. Solo padres.
//
// Los productos cuelgan de la lista al crearlos y al listarlos (siempre se
// ven en su contexto), pero se editan y se borran por su propio id: ver
// /api/admin/products/[productId].

type Contexto = { params: Promise<{ listId: string }> }

export const GET = route<Contexto>(async (_request, { params }) => {
  await requireParent()
  const { listId } = await params

  const productos = await prisma.product.findMany({
    where: { listId },
    orderBy: { createdAt: 'asc' },
  })

  return jsonOk({ products: productos })
})

export const POST = route<Contexto>(async (request, { params }) => {
  await requireParent()
  const { listId } = await params

  const datos = await parseBody(request, createProductSchema)

  // Se comprueba que la lista existe antes de insertar: si no, la FK fallaría
  // con un error de Postgres que hacia fuera sería un 500 sin sentido.
  const lista = await prisma.list.findUnique({
    where: { id: listId },
    select: { id: true },
  })

  if (!lista) {
    throw new ApiError(404, 'list_not_found', 'Esa lista no existe.')
  }

  const producto = await prisma.product.create({ data: { ...datos, listId } })

  return jsonOk({ product: producto }, 201)
})
