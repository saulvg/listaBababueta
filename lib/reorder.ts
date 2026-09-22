import { ApiError } from '@/lib/api/responses'
import { prisma } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma/client'

// La escritura de la columna `position`, de listas y de regalos, pasa toda por
// aquí. Es la misma regla que se aplica al estado de compra en
// lib/products/purchase.ts (CLAUDE.md §5) y por un motivo parecido: un PATCH
// genérico que aceptara `position` dejaría sin querer dos filas en el mismo
// sitio, y eso no salta como un error — se manifiesta semanas después como un
// baile de tarjetas en cada recarga que nadie sabe explicar.

/**
 * Lo que manda el navegador ya no cuadra con lo que hay guardado.
 *
 * Pasa de verdad y sin mala fe: los dos padres tienen el panel abierto, uno
 * añade un regalo y el otro arrastra una tarjeta sin haber recargado. El
 * segundo mandaría un orden al que le falta el regalo nuevo, y aplicarlo tal
 * cual dejaría a ese regalo compartiendo posición con otro.
 */
const ORDEN_CADUCADO = new ApiError(
  409,
  'order_stale',
  'Esto ha cambiado desde que abriste la página. Recárgala y vuelve a ordenarlo.',
)

/**
 * ¿Son `recibidos` y `guardados` el mismo conjunto de ids, ni uno más ni uno
 * menos ni ninguno repetido?
 *
 * El `delete` es lo que descarta los repetidos: al tachar cada id según se ve,
 * un id que venga dos veces no se encuentra la segunda. Sin eso, un cuerpo
 * como [a, a] contra un guardado [a, b] cuadraría de tamaño y pasaría.
 */
function mismoConjunto(guardados: string[], recibidos: string[]): boolean {
  if (guardados.length !== recibidos.length) return false

  const pendientes = new Set(guardados)
  return recibidos.every((id) => pendientes.delete(id))
}

/**
 * Deja las filas en el orden de `recibidos`, numerando desde 0.
 *
 * Exige el conjunto completo, no solo la fila que se ha movido: es lo que
 * permite detectar que el navegador estaba viendo otra cosa (ver arriba). A
 * cambio, el cuerpo de la petición es una lista de ids, que para un panel
 * familiar de unas decenas de tarjetas no es nada.
 *
 * Todo va dentro de una transacción: o se mueve el bloque entero o no se mueve
 * nada. Un corte a mitad dejaría media lista renumerada y la otra media no,
 * que es peor que no haber tocado nada.
 *
 * `actualizar` lo pone quien llama porque cada tabla tiene su propio WHERE:
 * los regalos, por ejemplo, filtran también por su lista.
 */
export async function aplicarOrden({
  guardados,
  recibidos,
  actualizar,
}: {
  guardados: string[]
  recibidos: string[]
  actualizar: (id: string, position: number) => Prisma.PrismaPromise<unknown>
}): Promise<void> {
  if (!mismoConjunto(guardados, recibidos)) throw ORDEN_CADUCADO

  await prisma.$transaction(
    // La lambda es a propósito: `.map(actualizar)` le pasaría también el array
    // como tercer argumento, y el día que `actualizar` crezca un parámetro más
    // eso deja de ser inofensivo.
    recibidos.map((id, indice) => actualizar(id, indice)),
  )
}
