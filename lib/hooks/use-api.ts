'use client'

import { useCallback, useEffect, useState } from 'react'

import { api } from '@/lib/api/client'

export type EstadoApi<T> = {
  datos: T | null
  /** Siempre un ApiClientError cuando la petición llegó al servidor. */
  error: unknown
  cargando: boolean
  /** Vuelve a pedir los datos (tras desbloquear una lista, tras crear algo). */
  recargar: () => void
  /**
   * Cambia los datos en pantalla sin pasar por el servidor. Es para cuando la
   * respuesta de una acción ya trae la verdad — al marcar un regalo como
   * comprado, por ejemplo — y volver a pedirlo todo sería una petición de más.
   */
  fijarDatos: (datos: T) => void
}

type Resultado<T> = {
  /** Qué petición produjo estos datos. */
  clave: string | null
  datos: T | null
  error: unknown
}

/**
 * Carga un GET de la API y lleva la cuenta de cargando / error / datos.
 *
 * Todas las pantallas hacen lo mismo — pedir al montar, repintar al volver — y
 * sin esto cada una tendría su propio useEffect con sus tres useState, que es
 * justo donde se cuelan los fallos aburridos: repintar tras desmontar, o
 * quedarse con la respuesta de la petición anterior al cambiar de lista.
 *
 * `cargando` NO es un estado: se deduce de si lo que hay guardado corresponde
 * a la petición actual. Así el efecto no escribe estado de forma síncrona
 * (que dispara un render en cascada, y la regla de React que lo prohíbe tiene
 * razón) y al cambiar de ruta no se ve un fotograma con los datos de la ruta
 * anterior.
 */
export function useApi<T>(ruta: string): EstadoApi<T> {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T>>({
    clave: null,
    datos: null,
    error: null,
  })

  // `recargar` cambia la clave sin cambiar la ruta: así se vuelve a pedir lo
  // mismo (tras acertar la clave de la lista, por ejemplo).
  const clave = `${intento}:${ruta}`

  useEffect(() => {
    // Si la ruta cambia antes de que conteste la petición anterior, su
    // respuesta ya no vale: este cierre la descarta.
    let vigente = true

    api
      .get<T>(ruta)
      .then((datos) => {
        if (vigente) setResultado({ clave, datos, error: null })
      })
      .catch((error) => {
        if (vigente) setResultado({ clave, datos: null, error })
      })

    return () => {
      vigente = false
    }
  }, [clave, ruta])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  const fijarDatos = useCallback(
    (datos: T) => setResultado((previo) => ({ ...previo, datos })),
    [],
  )

  const alDia = resultado.clave === clave

  return {
    datos: alDia ? resultado.datos : null,
    error: alDia ? resultado.error : null,
    cargando: !alDia,
    recargar,
    fijarDatos,
  }
}
