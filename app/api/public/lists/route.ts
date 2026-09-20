import { jsonOk } from '@/lib/api/responses'
import { route } from '@/lib/api/route'
import { getGuestSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

// GET /api/public/lists — índice de listas para la familia. Sin clave.
//
// Decisión consciente: cualquiera que llegue a la app ve los TÍTULOS de todas
// las listas, aunque no pueda abrir ninguna. La clave protege el contenido de
// cada lista, no su existencia. A cambio, un familiar no necesita que le
// manden un enlace concreto: entra, ve "Reyes 2026" y mete la clave.
//
// `accessKey` no aparece en el select. No es un descuido que se pueda cometer
// dos veces: si alguien añade aquí un `include` o quita el select, se filtra.

export const GET = route(async () => {
  const sesion = await getGuestSession()
  const desbloqueadas = new Set(sesion.unlockedListIds ?? [])

  const listas = await prisma.list.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  })

  return jsonOk({
    lists: listas.map(({ _count, ...lista }) => ({
      ...lista,
      productCount: _count.products,
      // Para que la UI pinte el candado abierto o cerrado sin una llamada por
      // lista.
      unlocked: desbloqueadas.has(lista.id),
    })),
  })
})
