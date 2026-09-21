'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/client'

/**
 * Cierra la sesión de los padres. No toca el acceso de la familia a las
 * listas: son dos cookies distintas a propósito (CLAUDE.md §5).
 *
 * En la pantalla de login no se pinta — no hay sesión que cerrar — y esa es la
 * única razón por la que este botón sabe en qué ruta está.
 */
export function BotonSalir() {
  const router = useRouter()
  const ruta = usePathname()
  const [saliendo, setSaliendo] = useState(false)

  if (ruta === '/entrar') return null

  async function salir() {
    setSaliendo(true)

    try {
      await api.post('/api/auth/logout')
    } finally {
      // Aunque el logout falle, aquí ya no se sigue: la pantalla siguiente
      // pedirá la sesión y, si sigue viva, volverá sola al panel.
      router.replace('/entrar')
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={salir} disabled={saliendo}>
      {saliendo ? 'Saliendo…' : 'Salir'}
    </Button>
  )
}
