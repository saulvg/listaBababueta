'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Un emoji animado, de los de Telegram, para meter dentro de una frase.
 *
 * Los ficheros se sirven desde `public/` y no desde un sitio de terceros: así
 * el navegador de quien nos visita no le entrega su IP a nadie más (ver
 * /aviso-legal) y la portada no depende de que ese sitio siga vivo. Son los
 * Noto Animated Emoji de Google, bajados de su CDN en webp — la mitad de peso
 * que el gif, mismo dibujo.
 *
 * Si no carga, se cae al emoji de siempre, el del sistema, que se pasa por
 * `fallback`.
 *
 * Medida en `em` y no en píxeles para que crezca con el texto que lo rodea, e
 * `inline-block` porque el preflight de Tailwind pone las imágenes en
 * `display: block` y si no saltan a la línea de abajo.
 */
export function EmojiAnimado({
  src,
  fallback,
  className,
}: {
  src: string
  /** El emoji de toda la vida, por si la imagen falla. */
  fallback: string
  className?: string
}) {
  const [falla, setFalla] = useState(false)

  // Adorno: el texto ya dice lo que hay que entender, así que ni la imagen ni
  // el emoji de reserva se anuncian a un lector de pantalla.
  if (falla) return <span aria-hidden>{fallback}</span>

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      onError={() => setFalla(true)}
      // Son un adorno: que no compitan por el ancho de banda con lo que de
      // verdad importa de la página.
      loading="lazy"
      fetchPriority="low"
      className={cn(
        'inline-block h-[1.2em] w-[1.2em] align-[-0.2em]',
        className,
      )}
    />
  )
}
