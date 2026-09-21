'use client'

import { Gift } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Imagen de un regalo, con reserva.
 *
 * Es un <img> a pelo y no next/image a propósito: la URL la pega quien crea el
 * regalo y puede ser de cualquier tienda del mundo, así que next/image
 * obligaría a declarar los dominios en `remotePatterns` uno a uno o a abrir un
 * comodín que no optimiza nada. Aquí no hay subida de ficheros (CLAUDE.md §3)
 * ni catálogo que controlar.
 *
 * La reserva no es solo para "no hay imagen": también salta cuando la tienda
 * devuelve un 404 o bloquea el enlace desde fuera, que pasa a menudo.
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const [fallida, setFallida] = useState(false)
  const hayImagen = Boolean(src) && !fallida

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-lg bg-muted',
        className,
      )}
    >
      {hayImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFallida(true)}
        />
      ) : (
        <Gift className="size-8 text-muted-foreground/40" aria-hidden />
      )}
    </div>
  )
}
