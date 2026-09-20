import { jsonOk } from '@/lib/api/responses'
import { route } from '@/lib/api/route'
import { getParentSession } from '@/lib/auth/session'

// POST /api/auth/logout — cierra la sesión de los padres.
//
// Solo toca la cookie de padres: el acceso de invitado a las listas es otra
// cookie y no tiene por qué caerse al salir del panel.

export const POST = route(async () => {
  const sesion = await getParentSession()
  sesion.destroy()

  return jsonOk({ ok: true })
})
