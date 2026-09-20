import { z } from 'zod'

// Login de la cuenta familiar. No hay registro ni recuperación de contraseña:
// las cuentas son fijas y viven en variables de entorno (CLAUDE.md §3 y §5).

export const loginSchema = z.object({
  email: z
    .email('Introduce un email válido.')
    .trim()
    .toLowerCase()
    // El email se compara contra PARENT_n_EMAIL, así que se normaliza aquí
    // para que "Papa@Casa.com" y "papa@casa.com" sean la misma cuenta.
    .max(200, 'El email es demasiado largo.'),
  // La contraseña NO se recorta ni se normaliza: los espacios cuentan, y
  // tocarla aquí rompería el hash que ya generó la persona.
  password: z
    .string('La contraseña es obligatoria.')
    .min(1, 'La contraseña es obligatoria.')
    // bcrypt solo mira los primeros 72 bytes; un límite generoso evita además
    // que alguien mande un megabyte y nos haga quemar CPU hasheándolo.
    .max(200, 'La contraseña es demasiado larga.'),
})

export type LoginInput = z.infer<typeof loginSchema>
