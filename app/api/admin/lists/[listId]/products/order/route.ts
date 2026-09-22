import { jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { reorderProducts } from '@/lib/products/order'
import { reorderProductsSchema } from '@/lib/validations/product'

// PATCH /api/admin/lists/[listId]/products/order — el orden de los regalos de
// una lista. Solo padres. Gemelo de /api/admin/lists/order, donde están
// explicadas las decisiones comunes.
//
// Aquí la lista va en la URL y no en el cuerpo porque es la que acota qué se
// puede mover: reorderProducts solo toca regalos cuyo `listId` coincide, así
// que un id ajeno colado en el cuerpo no mueve nada de otra lista.

type Contexto = { params: Promise<{ listId: string }> }

export const PATCH = route<Contexto>(async (request, { params }) => {
  await requireParent()
  const { listId } = await params

  const { ids } = await parseBody(request, reorderProductsSchema)

  await reorderProducts(listId, ids)

  return jsonOk({ ok: true })
})
