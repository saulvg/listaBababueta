import { jsonOk } from '@/lib/api/responses'
import { route } from '@/lib/api/route'
import { getGuestSession, getParentSession } from '@/lib/auth/session'

// GET /api/auth/session — quién es quien llama.
//
// La UI lo necesita para decidir si enseña el panel o el formulario de login
// sin tener que provocar un 401 a propósito.

export const GET = route(async () => {
  const padres = await getParentSession()
  const invitado = await getGuestSession()

  return jsonOk({
    parent: padres.email ? { email: padres.email } : null,
    // Ids de lista, no slugs: es lo que guarda la cookie. La UI compara
    // contra el id que devuelve /api/public/lists.
    unlockedListIds: invitado.unlockedListIds ?? [],
  })
})
