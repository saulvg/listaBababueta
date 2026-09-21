import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Enlace de volver, arriba a la izquierda.
 *
 * Existe porque la familia llega desde un enlace de WhatsApp: abre una lista
 * concreta y no ha pasado por ninguna pantalla anterior, así que el botón
 * "atrás" del navegador la saca de la app. Sin esto no hay forma de llegar al
 * resto de listas.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
