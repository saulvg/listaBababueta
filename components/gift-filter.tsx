'use client'

import type { ProductStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export type Filtro = 'todos' | 'disponibles' | 'comprados'

type ConStatus = { status: ProductStatus }

/** Cuántos hay de cada cosa, para los números de las pestañas. */
export function contarRegalos(regalos: ConStatus[]): Record<Filtro, number> {
  const comprados = regalos.filter(
    (regalo) => regalo.status === 'COMPRADO',
  ).length

  return {
    todos: regalos.length,
    disponibles: regalos.length - comprados,
    comprados,
  }
}

/**
 * Filtra en el navegador, sin pedir nada al servidor: los regalos de una
 * lista ya están todos aquí, y una lista familiar no pasa de unas decenas.
 */
export function filtrarRegalos<T extends ConStatus>(
  regalos: T[],
  filtro: Filtro,
): T[] {
  if (filtro === 'todos') return regalos

  const buscado: ProductStatus =
    filtro === 'comprados' ? 'COMPRADO' : 'DISPONIBLE'

  return regalos.filter((regalo) => regalo.status === buscado)
}

const OPCIONES: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  // "Sin comprar" antes que "Comprados": es lo que se viene a mirar.
  { valor: 'disponibles', etiqueta: 'Sin comprar' },
  { valor: 'comprados', etiqueta: 'Comprados' },
]

/**
 * Filtro de regalos, el mismo para la familia y para el panel.
 *
 * Son botones con `aria-pressed` y no un `<select>` ni pestañas de verdad:
 * son tres opciones, caben a la vista, y así se cambia de una en un toque
 * desde el móvil.
 */
export function GiftFilter({
  valor,
  onChange,
  conteos,
  className,
}: {
  valor: Filtro
  onChange: (filtro: Filtro) => void
  conteos: Record<Filtro, number>
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar regalos"
      className={cn(
        'inline-flex gap-0.5 rounded-xl border bg-muted/40 p-1',
        className,
      )}
    >
      {OPCIONES.map((opcion) => {
        const activa = opcion.valor === valor

        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(opcion.valor)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              activa
                ? 'bg-background font-medium text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opcion.etiqueta}
            <span
              className={cn(
                'ml-1.5 text-xs',
                activa ? 'text-muted-foreground' : 'text-muted-foreground/70',
              )}
            >
              {conteos[opcion.valor]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
