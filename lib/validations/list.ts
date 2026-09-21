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

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type ListAccessInput = z.infer<typeof listAccessSchema>
