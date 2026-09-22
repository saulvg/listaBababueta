import { z } from 'zod'

// Validación de listas de regalos. El slug NO se valida aquí porque no lo
// escribe nadie: se deriva del título al crear la lista (ver lib/lists/slug.ts)
// y luego no cambia, para no romper los enlaces ya compartidos.

const titulo = z
  .string('El título es obligatorio.')
  .trim()
  .min(1, 'El título no puede estar vacío.')
  .max(120, 'El título no puede pasar de 120 caracteres.')

/**
 * Clave de acceso de la lista. Único requisito real: no vacía (CLAUDE.md §5).
 * No se exige longitud ni complejidad a propósito — la eligen los padres para
 * dictarla por WhatsApp, y lo que la protege es el rate limiting del endpoint
 * de acceso, no su entropía.
 */
const claveAcceso = z
  .string('La clave de acceso es obligatoria.')
  // Se recorta porque al compartirla por mensaje se cuelan espacios al final,
  // y quien la teclee no debería fallar por eso. El endpoint de acceso recorta
  // igual, así que los dos lados comparan lo mismo.
  .trim()
  .min(1, 'La clave de acceso no puede estar vacía.')
  .max(120, 'La clave de acceso no puede pasar de 120 caracteres.')

/**
 * Dónde enviar los regalos. Texto libre, opcional y de varias líneas.
 *
 * No se valida como una dirección postal porque no tiene por qué serlo: cabe
 * igual un "pídenoslo por WhatsApp" que unas señas completas, y quien lo
 * escribe decide cuánto cuenta. El vacío se guarda como null y no como "",
 * para que la pantalla del regalo solo tenga que preguntar por una cosa.
 */
const direccionEnvio = z
  .string()
  .trim()
  .max(500, 'La dirección no puede pasar de 500 caracteres.')
  .nullable()
  .transform((valor) => valor || null)

/**
 * Si la lista está oculta a la familia. Ojo con lo que significa: no es "no
 * listada", es invisible del todo, también por su enlace directo y aunque se
 * tenga la clave. El porqué está en el campo `hidden` del esquema de Prisma.
 *
 * Solo en el PATCH y no al crear: se ocultan y se enseñan desde el botón del
 * ojo de cada tarjeta del panel, y una lista nace visible. Si algún día hace
 * falta crearla ya oculta, esto se añade abajo; mientras tanto no está para
 * que no haya un camino que nadie recorre.
 */
const oculta = z.boolean('Indica si la lista está oculta o no.')

export const createListSchema = z.object({
  title: titulo,
  accessKey: claveAcceso,
  // `.optional()` por fuera y no `.nullish()`: la diferencia importa en el
  // PATCH de abajo, donde no mandar el campo tiene que significar "no lo
  // toques" y mandarlo vacío, "bórralo". Aquí se comparte la misma pieza para
  // que las dos formas de guardar limpien igual.
  shippingAddress: direccionEnvio.optional(),
})

export const updateListSchema = z
  .object({
    title: titulo.optional(),
    accessKey: claveAcceso.optional(),
    // Ausente = no se toca (Prisma ignora `undefined`). Presente y vacío =
    // se borra. Si esto fuera `.nullish()`, un PATCH que solo cambiara el
    // título se llevaría por delante la dirección guardada.
    shippingAddress: direccionEnvio.optional(),
    hidden: oculta.optional(),
  })
  // Un PATCH sin ningún campo no es un error de datos pero sí una llamada
  // inútil: mejor decirlo que devolver un 200 que no ha cambiado nada.
  .refine((datos) => Object.keys(datos).length > 0, {
    error: 'No hay nada que actualizar.',
  })

/** Lo que manda un familiar para desbloquear una lista. */
export const listAccessSchema = z.object({
  accessKey: claveAcceso,
})

/**
 * El orden nuevo de las listas, de la primera a la última, tal y como han
 * quedado en el panel después de arrastrar una tarjeta.
 *
 * Van TODOS los ids y no solo el de la tarjeta movida, a propósito: es lo que
 * deja al servidor comprobar que el navegador estaba viendo lo mismo que hay
 * guardado antes de reescribir nada (ver lib/reorder.ts).
 *
 * El tope de 500 es defensivo y nada más. Este cuerpo lo escribe el navegador,
 * no una persona, así que aquí no hay un mensaje que enseñar: si salta es que
 * algo va mal por nuestra parte.
 */
export const reorderListsSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Hay un identificador vacío.'))
    .min(1, 'No hay nada que ordenar.')
    .max(500, 'Demasiadas listas en una sola petición.'),
})

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type ListAccessInput = z.infer<typeof listAccessSchema>
export type ReorderListsInput = z.infer<typeof reorderListsSchema>
