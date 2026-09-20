import { Prisma } from '@/lib/generated/prisma/client'

// Los códigos de error de Prisma que traducimos a respuestas HTTP.
// Referencia: https://www.prisma.io/docs/orm/reference/error-reference

/** La fila a actualizar o borrar no existe. */
export const REGISTRO_NO_ENCONTRADO = 'P2025'
/** Choque con un índice `@unique` (aquí, el slug de una lista). */
export const RESTRICCION_UNICA = 'P2002'

export function esErrorPrisma(error: unknown, codigo: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === codigo
  )
}
