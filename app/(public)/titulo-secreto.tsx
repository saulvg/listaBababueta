'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/** Cuánto hay que insistir con el ratón encima para que aparezca. */
const ESPERA_MS = 2500

/**
 * Las letras del nombre "secreto" son un revoltijo a propósito: el texto va
 * en el HTML, así que cualquiera con las herramientas del navegador abiertas
 * podría leerlo. Lo único de verdad aquí es la última letra.
 */
const BORRON = 'Nghrmvi'

/**
 * El título de la portada, con truco: al dejar el ratón encima tiembla, y si
 * se insiste un par de segundos asoma un nombre tan borroso que no se lee
 * ninguna letra... menos la última, que es una A.
 *
 * Es un juego, no información: el bloque va con `aria-hidden` porque leerle
 * un galimatías a quien navega con lector de pantalla no tiene ninguna gracia.
 */
export function TituloSecreto() {
  const [revelado, setRevelado] = useState(false)
  // Si hay un dedo o un ratón encima ahora mismo. Es estado y no `:hover` de
  // CSS porque en el móvil no hay hover: en Android, tocar no lo activa, y en
  // iOS se queda pegado después de soltar. Con estado, ratón y dedo se
  // comportan igual.
  const [encima, setEncima] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si alguien se va de la página con la cuenta atrás en marcha.
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [])

  function empezar() {
    setEncima(true)
    if (revelado || temporizador.current) return
    temporizador.current = setTimeout(() => setRevelado(true), ESPERA_MS)
  }

  function parar() {
    setEncima(false)

    if (temporizador.current) {
      clearTimeout(temporizador.current)
      temporizador.current = null
    }
    setRevelado(false)
  }

  return (
    <div
      // Con `pointer` en vez de `mouse` vale también en el móvil: mantener el
      // dedo encima cuenta como estar encima. Y `select-none` evita que esa
      // pulsación larga acabe seleccionando el texto en vez de jugar.
      onPointerEnter={empezar}
      onPointerLeave={parar}
      // Si el dedo se mueve un poco, el navegador entiende que empieza un
      // arrastre o un scroll y cancela el puntero: ahí se corta el juego.
      onPointerCancel={parar}
      // `select-none` y el callout de iOS: sin ellos, mantener el dedo dos
      // segundos sobre un texto abre el menú de seleccionar y copiar en vez
      // de jugar.
      className="select-none [-webkit-touch-callout:none]"
    >
      <h1
        className={cn(
          'text-4xl',
          // Deja de temblar al revelarse: el nombre se ha "posado".
          encima && !revelado && 'motion-safe:animate-tiembla',
        )}
      >
        Lista Bababueta
      </h1>

      <p
        aria-hidden
        className={cn(
          'mt-1 h-8 font-heading text-2xl transition-opacity duration-1000',
          revelado ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="blur-[5px]">{BORRON}</span>
        <span>A</span>
      </p>
    </div>
  )
}
