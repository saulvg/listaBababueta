'use client'

import { useState } from 'react'

export function EmojiBilletes() {
  const [falla, setFalla] = useState(false)

  // Adorno: el texto ya dice lo que hay que entender, así que ni la imagen ni
  // el emoji de reserva se anuncian a un lector de pantalla.
  if (falla) return <span aria-hidden>💸</span>

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://images.emojiterra.com/google/noto-emoji/animated-emoji/1f4b8.gif"
      alt=""
      aria-hidden
      onError={() => setFalla(true)}
      className="ml-1 inline-block h-[1.2em] w-[1.2em] align-[-0.2em]"
    />
  )
}
