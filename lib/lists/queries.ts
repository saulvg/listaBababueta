import { isParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

/**
 * ¿Puede verse esta lista desde fuera del panel?
 *
 * Una lista oculta no es "no listada": para quien no sea uno de los padres
 * tiene que ser indistinguible de una lista que no existe. Por eso esto
 * devuelve un booleano y quien llama contesta con el MISMO 404 que daría un
 * slug inventado. Un 403 del tipo "esta lista está oculta" confirmaría que
 * existe, que es justo lo que se quiere evitar al ocultarla.
 *
 * Los padres la ven igual que siempre: son los dueños, y el panel es su sitio.
 */
export async function esVisible(lista: { hidden: boolean }): Promise<boolean> {
  if (!lista.hidden) return true

  return isParent()
}

/**
 * La lista que hay detrás de un slug, o `null` si no existe **o si quien
 * pregunta no puede verla**.
 *
 * Los dos casos se mezclan a propósito (ver esVisible): quien llama ya trata
 * el `null` como "esa lista no existe", así que ocultar una lista no exige
 * tocar ninguna pantalla ni acordarse de nada. El nombre dice "Visible" para
 * que el día que alguien escriba un `findListBySlug` a secas se note que le
 * falta algo.
 *
 * Vive aquí y no dentro del Route Handler porque la usan dos sitios: el propio
 * handler (GET /api/public/lists/[slug]) y el `generateMetadata` de la página
 * de la lista, que necesita el título para la vista previa del enlace
 * compartido. Es la regla de CLAUDE.md §4: una página de servidor que necesita
 * datos importa la misma función que el handler, no duplica la consulta ni se
 * salta la frontera.
 *
 * `accessKey` no sale de aquí: no está en el select, y no lo está a propósito.
 * Quien necesite comprobar la clave usa requireListAccess.
 *
 * `shippingAddress` SÍ sale, y por eso hay que mirar dónde se usa esto: el
 * Route Handler lo devuelve después de `requireListAccess`, y el
 * `generateMetadata` de la página no lo toca. Una dirección de casa no puede
 * acabar en una vista previa de WhatsApp ni en el índice de listas, que es
 * público.
 */
export async function findVisibleListBySlug(slug: string) {
  const lista = await prisma.list.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      shippingAddress: true,
      hidden: true,
      createdAt: true,
    },
  })

  if (!lista || !(await esVisible(lista))) return null

  // Campo a campo y no `...lista` sin `hidden`: `hidden` es un dato de dentro
  // del panel y no tiene por qué viajar al navegador de la familia. Si el
  // select de arriba crece, el olvido no se publica solo.
  return {
    id: lista.id,
    title: lista.title,
    slug: lista.slug,
    shippingAddress: lista.shippingAddress,
    createdAt: lista.createdAt,
  }
}
