import { prisma } from '@/lib/db'
import { aplicarOrden } from '@/lib/reorder'

/**
 * Posición para un regalo nuevo: al final de su lista.
 *
 * Al revés que las listas (ver lib/lists/order.ts), y a propósito: los regalos
 * se van apuntando según se le ocurren a uno, y ese orden ya es el bueno
 * mientras nadie lo toque. Era también el que enseñaba la app antes de que
 * hubiera orden manual, del más antiguo al más nuevo.
 */
export async function nextProductPosition(listId: string): Promise<number> {
  const { _max } = await prisma.product.aggregate({
    where: { listId },
    _max: { position: true },
  })

  return _max.position === null ? 0 : _max.position + 1
}

/**
 * Deja los regalos de una lista en el orden de `ids`. Junto con
 * nextProductPosition, el único sitio que escribe `position` en la tabla de
 * productos.
 */
export async function reorderProducts(
  listId: string,
  ids: string[],
): Promise<void> {
  const guardados = await prisma.product.findMany({
    where: { listId },
    select: { id: true },
  })

  await aplicarOrden({
    guardados: guardados.map((producto) => producto.id),
    recibidos: ids,
    // El `listId` va en el WHERE además del id. La comprobación de conjunto de
    // aplicarOrden ya impide que se cuele el id de otra lista, pero esta regla
    // no tiene por qué depender de aquella: quien lea este UPDATE suelto ve
    // que no puede tocar un regalo ajeno.
    actualizar: (id, position) =>
      prisma.product.updateMany({ where: { id, listId }, data: { position } }),
  })
}
