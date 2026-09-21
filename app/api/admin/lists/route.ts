import { ApiError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { RESTRICCION_UNICA, esErrorPrisma } from '@/lib/db-errors'
import { generarSlugUnico } from '@/lib/lists/slug'
import { createListSchema } from '@/lib/validations/list'

// /api/admin/lists — listado y creación. Solo padres.
//
// Al contrario que la vista pública, aquí SÍ se devuelve la clave de acceso:
// los padres necesitan volver a leerla para compartirla, y por eso se guarda
// en texto plano (CLAUDE.md §5).

export const GET = route(async () => {
  await requireParent()

  // El panel enseña "4 regalos · 1 comprado" sin traerse los productos. Van
  // dos consultas y no una porque Prisma no deja contar dos veces la misma
  // relación con filtros distintos dentro del mismo `_count`.
  const [listas, comprados] = await Promise.all([
    prisma.list.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.groupBy({
      by: ['listId'],
      where: { status: 'COMPRADO' },
      _count: { _all: true },
    }),
  ])

  const compradosPorLista = new Map(
    comprados.map((fila) => [fila.listId, fila._count._all]),
  )

  return jsonOk({
    lists: listas.map(({ _count, ...lista }) => ({
      ...lista,
      productCount: _count.products,
      purchasedCount: compradosPorLista.get(lista.id) ?? 0,
    })),
  })
})

export const POST = route(async (request) => {
  await requireParent()

  const datos = await parseBody(request, createListSchema)
  const slug = await generarSlugUnico(prisma, datos.title)

  try {
    const lista = await prisma.list.create({ data: { ...datos, slug } })
    return jsonOk({ list: lista }, 201)
  } catch (error) {
    // generarSlugUnico consulta antes de insertar, así que esto solo salta si
    // otra petición se ha colado en medio. Se traduce en vez de reintentar:
    // volver a pulsar "crear" es más simple que un bucle de reintentos.
    if (esErrorPrisma(error, RESTRICCION_UNICA)) {
      throw new ApiError(
        409,
        'slug_conflict',
        'Ya existe una lista con esa dirección. Prueba otra vez.',
      )
    }
    throw error
  }
})
