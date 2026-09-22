import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from 'iron-session'
import { cookies } from 'next/headers'

import { ApiError } from '@/lib/api/responses'
import type { ParentAccount } from '@/lib/auth/parents'

// Dos sesiones distintas, en dos cookies distintas, porque son dos personas
// distintas usando la misma app:
//
//   padres   -> quién administra las listas.
//   invitado -> qué listas ha desbloqueado este navegador, y un id anónimo
//               para el futuro aviso de "alguien está viendo esto".
//
// Separarlas evita el fallo clásico de meterlo todo en una cookie y que al
// cerrar sesión como padre se pierda el acceso de invitado (o al revés).

const UN_DIA = 60 * 60 * 24

export type ParentSession = {
  email?: string
}

export type GuestSession = {
  /** Id anónimo de este navegador. Sirve para el soft lock (CLAUDE.md §3). */
  viewerId?: string
  /** Listas cuya clave ya se acertó desde este navegador. */
  unlockedListIds?: string[]
}

function secretoDeSesion(): string {
  const secreto = process.env.SESSION_SECRET

  // iron-session firma y cifra la cookie con esto. Si faltara, la sesión sería
  // falsificable, así que es mejor romper ruidosamente que arrancar inseguro.
  if (!secreto || secreto.length < 32) {
    throw new Error(
      'SESSION_SECRET falta o tiene menos de 32 caracteres. ' +
        'Genera uno con `openssl rand -base64 32` (ver .env.example).',
    )
  }

  return secreto
}

function opciones(cookieName: string, ttl: number): SessionOptions {
  return {
    password: secretoDeSesion(),
    cookieName,
    ttl,
    cookieOptions: {
      httpOnly: true,
      // `lax` deja que el enlace compartido por WhatsApp llegue con la cookie
      // puesta; `strict` obligaría a meter la clave otra vez en cada enlace.
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  }
}

export async function getParentSession(): Promise<IronSession<ParentSession>> {
  // 7 días: si los padres tocan la lista una vez por semana, no reloguean.
  return getIronSession<ParentSession>(
    await cookies(),
    opciones('bababueta_padres', UN_DIA * 7),
  )
}

export async function getGuestSession(): Promise<IronSession<GuestSession>> {
  // 30 días: la familia entra a la lista cada pocos días durante una campaña
  // de Reyes o un cumpleaños, y volver a pedir la clave cada vez cansa.
  return getIronSession<GuestSession>(
    await cookies(),
    opciones('bababueta_invitado', UN_DIA * 30),
  )
}

/**
 * Exige sesión de padres. Lanza 401 si no la hay: los handlers no tienen que
 * acordarse de comprobar el `null`.
 */
export async function requireParent(): Promise<ParentAccount> {
  const sesion = await getParentSession()

  if (!sesion.email) {
    throw new ApiError(401, 'unauthorized', 'Necesitas iniciar sesión.')
  }

  return { email: sesion.email }
}

/**
 * ¿Hay sesión de padres abierta?
 *
 * La versión sin excepción de requireParent, para las decisiones que no son
 * "corta aquí" sino "enseña una cosa u otra". La usa la visibilidad de las
 * listas ocultas (lib/lists/queries.ts): una lista oculta existe para los
 * padres y no existe para nadie más, y eso no es un 403, es otra respuesta.
 */
export async function isParent(): Promise<boolean> {
  const sesion = await getParentSession()

  return Boolean(sesion.email)
}

/** Anota en la cookie que este navegador ha acertado la clave de una lista. */
export async function grantListAccess(listId: string): Promise<void> {
  const sesion = await getGuestSession()
  const desbloqueadas = new Set(sesion.unlockedListIds ?? [])

  desbloqueadas.add(listId)
  sesion.unlockedListIds = [...desbloqueadas]
  sesion.viewerId ??= crypto.randomUUID()

  await sesion.save()
}

/**
 * Exige que este navegador haya desbloqueado ESTA lista. Acertar la clave de
 * una lista no abre las demás (CLAUDE.md §5): por eso se comprueba el id
 * concreto y no un simple "es invitado".
 *
 * Los padres con sesión abierta entran sin clave: son los dueños de la lista,
 * obligarles a teclear su propia clave para verla no protege de nada.
 */
export async function requireListAccess(listId: string): Promise<void> {
  const sesion = await getGuestSession()

  if (sesion.unlockedListIds?.includes(listId)) return

  if (await isParent()) return

  throw new ApiError(
    403,
    'list_locked',
    'Necesitas la clave de acceso de esta lista.',
  )
}
