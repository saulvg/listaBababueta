import { prisma } from '@/lib/db'

/**
 * La lista que hay detrás de un slug, o `null` si no existe.
 *
 * Vive aquí y no dentro del Route Handler porque ahora la usan dos sitios: el
 * propio handler (GET /api/public/lists/[slug]) y el `generateMetadata` de la
 * página de la lista, que necesita el título para la vista previa del enlace
 * compartido. Es la regla de CLAUDE.md §4: una página de servidor que
 * necesita datos importa la misma función que el handler, no duplica la
 * consulta ni se salta la frontera.
 *
 * `accessKey` no sale de aquí: no está en el select, y no lo está a
 * propósito. Quien necesite comprobar la clave usa requireListAccess.
 *
 * `shippingAddress` SÍ sale, y por eso hay que mirar dónde se usa esto: el
 * Route Handler lo devuelve después de `requireListAccess`, y el
 * `generateMetadata` de la página no lo toca. Una dirección de casa no puede
 * acabar en una vista previa de WhatsApp ni en el índice de listas, que es
 * público.
 */
export function findListBySlug(slug: string) {
  return prisma.list.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      shippingAddress: true,
      createdAt: true,
    },
  })
}
