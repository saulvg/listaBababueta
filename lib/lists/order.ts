import { prisma } from '@/lib/db'
import { aplicarOrden } from '@/lib/reorder'

/**
 * Posición para una lista recién creada: por encima de todas las demás.
 *
 * Antes de que hubiera orden manual, el panel enseñaba las listas de la más
 * nueva a la más vieja. Dejarla arriba es seguir haciendo lo mismo, y además
 * es donde va a mirar quien acaba de pulsar "crear lista".
 *
 * Se resta 1 al mínimo en vez de renumerar las demás: una escritura en lugar
 * de N, y las posiciones negativas ordenan igual de bien (ver el comentario de
 * `position` en el esquema de Prisma).
 *
 * Dos altas a la vez pueden salir con el mismo número, y no se hace nada por
 * evitarlo: el desempate por fecha las deja en un orden estable y esto son dos
 * personas compartiendo un panel, no un alta masiva.
 */
export async function nextListPosition(): Promise<number> {
  const { _min } = await prisma.list.aggregate({ _min: { position: true } })

  return _min.position === null ? 0 : _min.position - 1
}

/**
 * Deja las listas en el orden de `ids`. Junto con nextListPosition, el único
 * sitio que escribe `position` en la tabla de listas.
 */
export async function reorderLists(ids: string[]): Promise<void> {
  const guardadas = await prisma.list.findMany({ select: { id: true } })

  await aplicarOrden({
    guardados: guardadas.map((lista) => lista.id),
    recibidos: ids,
    // updateMany y no update: si alguien borra una lista justo entre la
    // consulta de arriba y la transacción, update lanzaría un P2025 que
    // saldría como un 500. Así esa fila simplemente no se mueve y el resto del
    // orden se aplica igual.
    actualizar: (id, position) =>
      prisma.list.updateMany({ where: { id }, data: { position } }),
  })
}
