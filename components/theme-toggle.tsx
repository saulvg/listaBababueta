'use client'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { alternarTema } from '@/lib/theme'

/**
 * Interruptor de modo claro / oscuro.
 *
 * Qué icono se ve NO depende de un estado de React: los dos están en el DOM y
 * el que sobra lo esconde la variante `dark:` de Tailwind. Así el servidor y
 * el cliente pintan exactamente lo mismo (no hay desajuste de hidratación
 * aunque el script del <head> ya haya puesto la clase `dark`) y el icono
 * correcto aparece en el primer fotograma, sin esperar a que monte nada.
 */
export function ThemeToggle() {
  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar entre modo claro y oscuro"
      onClick={() => alternarTema()}
      // Al pasar por encima, el botón se pinta con los colores del OTRO modo:
      // en claro se pone negro sobre blanco, y en oscuro al revés. No hacen
      // falta dos reglas porque son las propias variables las que se dan la
      // vuelta con el tema — `foreground` y `background` ya significan cosas
      // opuestas en cada uno. Es un anticipo de lo que va a pasar al pulsar.
      className="size-11 rounded-full hover:bg-foreground hover:text-background dark:hover:bg-foreground dark:hover:text-background"
    >
      <Sun className="size-5 dark:hidden" aria-hidden />
      <Moon className="hidden size-5 dark:block" aria-hidden />
    </Button>
  )
}
