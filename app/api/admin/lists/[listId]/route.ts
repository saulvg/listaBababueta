import { ApiError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { REGISTRO_NO_ENCONTRADO, esErrorPrisma } from '@/lib/db-errors'
import { updateListSchema } from '@/lib/validations/list'

// /api/admin/lists/[listId] — una lista concreta, con sus productos. Solo padres.

type Contexto = { params: Promise<{ listId: string }> }

const NO_EXISTE = new ApiError(404, 'list_not_found', 'Esa lista no existe.')

export const GET = route<Contexto>(async (_request, { params }) => {
  await requireParent()
  const { listId } = await params

  const lista = await prisma.list.findUnique({
    where: { id: listId },
    include: { products: { orderBy: { createdAt: 'asc' } } },
  })

  if (!lista) throw NO_EXISTE

  return jsonOk({ list: lista })
})

export const PATCH = route<Contexto>(async (request, { params }) => {
  await requireParent()
  const { listId } = await params

  const datos = await parseBody(request, updateListSchema)

  // El slug NO se recalcula aunque cambie el título: los enlaces ya enviados
  // a la familia tienen que seguir funcionando (ver lib/lists/slug.ts).
  try {
    const lista = await prisma.list.update({
      where: { id: listId },
      data: datos,
    })
    return jsonOk({ list: lista })
  } catch (error) {
    if (esErrorPrisma(error, REGISTRO_NO_ENCONTRADO)) throw NO_EXISTE
    throw error
  }
})

export const DELETE = route<Contexto>(async (_request, { params }) => {
  await requireParent()
  const { listId } = await params

  // Los productos caen con la lista: la FK lleva onDelete: Cascade.
  try {
    await prisma.list.delete({ where: { id: listId } })
    return jsonOk({ ok: true })
  } catch (error) {
    if (esErrorPrisma(error, REGISTRO_NO_ENCONTRADO)) throw NO_EXISTE
    throw error
  }
})
