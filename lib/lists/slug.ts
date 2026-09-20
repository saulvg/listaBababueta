import type { PrismaClient } from '@/lib/generated/prisma/client'

// El slug es la parte visible de la URL que se comparte con la familia
// (/lista/<slug>). Se deriva del título al crear la lista y después NO cambia
// aunque el título sí: un enlace ya mandado por WhatsApp tiene que seguir
// funcionando.

const LONGITUD_MAXIMA = 60

/** Si el título no deja ni una letra utilizable (p. ej. "🎁🎁"), este es el apaño. */
const SLUG_POR_DEFECTO = 'lista'

export function slugify(texto: string): string {
  const slug = texto
    .normalize('NFD')
    // Quita los diacríticos que NFD acaba de separar: "Reyés" -> "Reyes".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LONGITUD_MAXIMA)
    // El recorte anterior puede dejar un guion colgando al final.
    .replace(/-+$/, '')

  return slug || SLUG_POR_DEFECTO
}

/**
 * Deriva un slug libre a partir del título. Si ya existe, va probando
 * `-2`, `-3`… hasta encontrar hueco.
 *
 * Esto no es una garantía dura: entre la consulta y el INSERT cabe otra
 * petición. La garantía real es el índice `@unique` de la columna, y quien
 * llama traduce esa colisión a un 409 (ver el handler de creación de listas).
 * No merece más ceremonia: dos padres creando la misma lista en el mismo
 * milisegundo no es un caso que vaya a ocurrir.
 */
export async function generarSlugUnico(
  db: PrismaClient,
  titulo: string,
): Promise<string> {
  const base = slugify(titulo)

  const ocupados = new Set(
    (
      await db.list.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((lista) => lista.slug),
  )

  if (!ocupados.has(base)) return base

  let sufijo = 2
  while (ocupados.has(`${base}-${sufijo}`)) sufijo += 1

  return `${base}-${sufijo}`
}
