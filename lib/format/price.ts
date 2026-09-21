// El precio se guarda en CÉNTIMOS como entero (CLAUDE.md §3) y la conversión
// desde euros es cosa del formulario. Este fichero es ese formulario: la
// frontera entre lo que teclea una persona ("24,50") y lo que viaja a la API
// (2450).

const FORMATO_ENTERO = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const FORMATO_CON_DECIMALES = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

/**
 * Precio para pintar en pantalla: `≈ 320 €`, `≈ 24,50 €`, o nada si no hay
 * precio. El `≈` va dentro a propósito — el campo se llama "precio estimado"
 * y siempre lo es, así que no debería depender de que cada pantalla se acuerde
 * de ponerlo.
 *
 * Los céntimos redondos se enseñan sin decimales: en una rejilla, "320 €" se
 * lee de un vistazo y "320,00 €" es ruido.
 */
export function formatearPrecio(centimos: number | null | undefined): string {
  if (centimos === null || centimos === undefined) return ''

  const euros = centimos / 100
  const formato = centimos % 100 === 0 ? FORMATO_ENTERO : FORMATO_CON_DECIMALES

  return `≈ ${formato.format(euros)}`
}

/** Lo que se mete en el input al editar un regalo que ya tiene precio. */
export function centimosAEuros(centimos: number | null | undefined): string {
  if (centimos === null || centimos === undefined) return ''

  const euros = centimos / 100
  return centimos % 100 === 0
    ? String(euros)
    : euros.toFixed(2).replace('.', ',')
}

export type PrecioTecleado =
  { ok: true; centimos: number | null } | { ok: false; error: string }

/**
 * Lee lo que se ha tecleado en el campo de precio.
 *
 * Acepta coma y punto como separador decimal (en un teclado de móvil español
 * sale una coma, y en el numérico de un portátil, un punto) y perdona los
 * espacios y el símbolo del euro. Vacío significa "sin precio", que es un caso
 * normal, no un error.
 *
 * Solo comprueba que sea un número: que no sea negativo y que no se pase de
 * tope ya lo dice el esquema de Zod, y repetir esas reglas aquí sería tener
 * dos sitios donde cambiarlas.
 */
export function parsearEuros(texto: string): PrecioTecleado {
  const limpio = texto.replace(/[\s€]/g, '').replace(',', '.')

  if (limpio === '') return { ok: true, centimos: null }

  const euros = Number(limpio)

  if (!Number.isFinite(euros)) {
    return {
      ok: false,
      error: 'Escribe el precio en euros, por ejemplo 24,50.',
    }
  }

  // Redondear al céntimo: 19.99 * 100 da 1998.9999999999998 en coma flotante,
  // que es justo el error que se evita guardando enteros.
  return { ok: true, centimos: Math.round(euros * 100) }
}
