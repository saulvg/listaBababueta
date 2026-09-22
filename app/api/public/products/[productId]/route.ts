import { ApiError, jsonOk } from '@/lib/api/responses'
import { route } from '@/lib/api/route'
import { requireListAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { esVisible } from '@/lib/lists/queries'

// GET /api/public/products/[productId] — un regalo suelto.
//
// Existe porque el detalle de un regalo es una página con URL propia y
// compartible (/lista/<slug>/<id>): quien la abre directa desde un mensaje no
// ha pasado por la lista, así que no hay nada cargado de lo que sacar el
// producto.
//
// Devuelve también el título y el slug de su lista, que es lo que necesita la
// pantalla para la cabecera y para el enlace de volver — y así no hace una
// segunda petición para eso.

type Contexto = { params: Promise<{ productId: string }> }

export const GET = route<Contexto>(async (_request, { params }) => {
  const { productId } = await params

  const producto = await prisma.product.findUnique({
    where: { id: productId },
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
      // La dirección de envío viaja con el regalo porque es justo aquí donde
      // se necesita: quien está a punto de comprar en una tienda no tiene por
      // qué volver a la lista a buscarla. Sale después de requireListAccess,
      // nunca antes.
      list: {
        select: {
          id: true,
          title: true,
          slug: true,
          shippingAddress: true,
          hidden: true,
        },
      },
    },
  })

  if (!producto) {
    throw new ApiError(
      404,
      'product_not_found',
      'Ese regalo ya no está en la lista.',
    )
  }

  // Si la lista está oculta, sus regalos se ocultan con ella. Sin esto, el
  // enlace directo a un regalo sería la rendija por la que seguir viendo una
  // lista archivada: la URL de un regalo se comparte por WhatsApp igual que la
  // de la lista, y quedan guardadas en las conversaciones para siempre.
  if (!(await esVisible(producto.list))) {
    throw new ApiError(
      404,
      'product_not_found',
      'Ese regalo ya no está en la lista.',
    )
  }

  // La misma guarda que en la lista entera: el id de un producto no puede ser
  // una rendija para ver el contenido de una lista cuya clave no se conoce.
  // El 403 `list_locked` es lo que hace que la pantalla enseñe el formulario
  // de la clave en vez de un error.
  await requireListAccess(producto.list.id)

  const { list, ...regalo } = producto

  // `hidden` se queda aquí: es un dato del panel, y a la familia solo le llega
  // lo que la pantalla del regalo necesita pintar.
  return jsonOk({
    product: regalo,
    list: {
      id: list.id,
      title: list.title,
      slug: list.slug,
      shippingAddress: list.shippingAddress,
    },
  })
})
