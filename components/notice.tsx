import { AlertCircle, CheckCircle2, Eye } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Tono = 'error' | 'aviso' | 'hecho'

const ESTILOS: Record<Tono, string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  aviso: 'border-warning/30 bg-warning/10 text-warning',
  hecho: 'border-success/30 bg-success/10 text-success',
}

const ICONOS: Record<Tono, typeof AlertCircle> = {
  error: AlertCircle,
  aviso: Eye,
  hecho: CheckCircle2,
}

/**
 * Franja de aviso: el error de un formulario, el "alguien se te ha
 * adelantado", el "ya está comprado". Un solo componente para los tres para
 * que no acaben con tres rellenos y tres redondeos distintos.
 */
export function Notice({
  tone = 'error',
  className,
  children,
}: {
  tone?: Tono
  className?: string
  children: ReactNode
}) {
  const Icono = ICONOS[tone]

  return (
    <p
      // Los errores de una acción aparecen después de pulsar, así que hay que
      // anunciarlos: sin esto, quien navega con lector de pantalla pulsa
      // "Marcar como comprado" y no se entera de que ha fallado.
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        ESTILOS[tone],
        className,
      )}
    >
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
