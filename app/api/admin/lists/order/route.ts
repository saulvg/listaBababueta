import { jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { reorderLists } from '@/lib/lists/order'
import { reorderListsSchema } from '@/lib/validations/list'

// PATCH /api/admin/lists/order — el orden de las listas del panel. Solo padres.
//
// Endpoint propio y no un campo más del PATCH de cada lista, a propósito:
// reordenar es una operación sobre el CONJUNTO — se reescriben todas las
// posiciones a la vez y dentro de una transacción —, no el retoque de una
// fila. Colarlo en el PATCH de /lists/[listId] lo convertiría además en la
// puerta trasera que lib/reorder.ts existe para evitar.
//
// Sobre la URL: este segmento `order` convive con el `[listId]` de al lado
// porque en el App Router lo estático gana a lo dinámico. No hay ambigüedad
// posible en la práctica — los ids son cuid y ninguno puede valer "order" —,
// pero conviene saberlo antes de renombrar carpetas por aquí.

export const PATCH = route(async (request) => {
  await requireParent()

  const { ids } = await parseBody(request, reorderListsSchema)

  await reorderLists(ids)

  // Sin cuerpo útil: el navegador ya está pintando el orden nuevo desde que se
  // soltó la tarjeta, y devolvérselo solo le daría ocasión de parpadear.
  return jsonOk({ ok: true })
})
