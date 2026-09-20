import { z } from 'zod'

// Validación de productos. Dos reglas de fondo que conviene tener presentes:
//
// 1. El precio viaja y se guarda en CÉNTIMOS como entero (ver el esquema de
//    Prisma). La conversión desde euros es cosa del formulario, no de la API.
// 2. Los campos opcionales que llegan vacíos se guardan como `null`, nunca
//    como cadena vacía, para que "sin comentario" tenga una sola
//    representación en la base de datos.

/**
 * Enlaces: solo http(s). No es quisquillosidad — estas URL acaban en un
 * `href` y en un `src` de la vista pública, así que aceptar `javascript:` o
 * `data:` sería abrirle la puerta a que quien edite la lista inyecte código
 * en el navegador de la familia.
 */
function esEnlaceHttp(valor: string): boolean {
  if (!z.url().safeParse(valor).success) return false
  try {
    const { protocol } = new URL(valor)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function enlaceOpcional(mensaje: string) {
  return z
    .string()
    .trim()
    .max(2048, 'El enlace es demasiado largo.')
    .refine((valor) => valor === '' || esEnlaceHttp(valor), { error: mensaje })
    .transform((valor) => (valor === '' ? null : valor))
    .nullish()
}

function textoOpcional(maximo: number, mensaje: string) {
  return z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor === '' ? null : valor))
    .nullish()
}

const titulo = z
  .string('El título es obligatorio.')
  .trim()
  .min(1, 'El título no puede estar vacío.')
  .max(200, 'El título no puede pasar de 200 caracteres.')

const precioEnCentimos = z
  .int('El precio debe ser un número entero de céntimos.')
  .min(0, 'El precio no puede ser negativo.')
  // 1.000.000 € de tope. No es una regla de negocio, es un cortafuegos contra
  // el dedazo de quien teclea euros donde van céntimos.
  .max(100_000_000, 'El precio parece un error: revisa que sean céntimos.')
  .nullish()

const camposProducto = {
  title: titulo,
  url: enlaceOpcional(
    'El enlace de la tienda debe empezar por http:// o https://.',
  ),
  imageUrl: enlaceOpcional(
    'El enlace de la imagen debe empezar por http:// o https://.',
  ),
  priceCents: precioEnCentimos,
  comment: textoOpcional(
    1000,
    'El comentario no puede pasar de 1000 caracteres.',
  ),
}

export const createProductSchema = z.object(camposProducto)

export const updateProductSchema = z
  .object({
    title: titulo.optional(),
    url: camposProducto.url,
    imageUrl: camposProducto.imageUrl,
    priceCents: camposProducto.priceCents,
    comment: camposProducto.comment,
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    error: 'No hay nada que actualizar.',
  })

/**
 * Lo que manda un familiar al marcar un producto como comprado. El nombre es
 * texto libre y opcional: dejarlo en blanco significa compra anónima, y de
 * pasarlo a `null` ya se encarga markProductAsPurchased().
 */
export const purchaseProductSchema = z.object({
  purchasedBy: z
    .string()
    .trim()
    .max(100, 'El nombre no puede pasar de 100 caracteres.')
    .nullish(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type PurchaseProductInput = z.infer<typeof purchaseProductSchema>
