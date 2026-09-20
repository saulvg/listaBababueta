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

export const createListSchema = z.object({
  title: titulo,
  accessKey: claveAcceso,
})

export const updateListSchema = z
  .object({
    title: titulo.optional(),
    accessKey: claveAcceso.optional(),
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
