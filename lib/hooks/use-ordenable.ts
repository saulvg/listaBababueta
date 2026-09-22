'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { KeyboardEvent, PointerEvent, RefCallback } from 'react'

import { mensajeDeError } from '@/lib/api/client'

// Arrastrar y soltar para ordenar tarjetas, escrito a mano sobre Pointer
// Events. Unas doscientas líneas en lugar de cinco paquetes de terceros, y la
// razón no es el tamaño del bundle:
//
//   - La librería de referencia (@dnd-kit v6) lleva sin publicarse desde
//     diciembre de 2024 y nunca declaró soportar React 19, que es donde va
//     este proyecto. Un paquete sin mantener pero con permisos de publicación
//     vivos es además el perfil exacto de los gusanos de npm de 2025.
//   - Lo que hace falta aquí es mover un puñado de tarjetas en una pantalla
//     que usan dos personas. Esa librería trae motores de colisión, sensores,
//     overlays y cinco estrategias de ordenación que no íbamos a tocar.
//
// Pointer Events y no el arrastre nativo de HTML5 porque aquel no funciona con
// el dedo en iOS ni en Android, y el panel se usa desde el móvil. Un solo
// camino de código sirve para ratón, dedo y lápiz.

/** A qué distancia del borde de la ventana empieza a desplazarse sola. */
const MARGEN_AUTOSCROLL = 72
/** Cuánto se desplaza en cada fotograma mientras el puntero está en el borde. */
const PASO_AUTOSCROLL = 12

type Arrastre = {
  id: string
  /** Puntero en coordenadas de ventana. */
  punteroX: number
  punteroY: number
  /** Dónde se agarró la tarjeta, medido desde su esquina superior izquierda. */
  agarreX: number
  agarreY: number
  /** Desplazamiento aplicado ahora mismo a la tarjeta. */
  dx: number
  dy: number
}

export type Ordenable = { id: string }

export type PropsDeTirador = {
  onPointerDown: (evento: PointerEvent<HTMLElement>) => void
  onPointerMove: (evento: PointerEvent<HTMLElement>) => void
  onPointerUp: () => void
  onPointerCancel: () => void
  onKeyDown: (evento: KeyboardEvent<HTMLElement>) => void
  'aria-label': string
  /** Sin esto, el navegador entiende el arrastre como un gesto de scroll. */
  style: { touchAction: 'none' }
}

/** Mueve un elemento de `desde` a `hasta`, sin tocar el array original. */
function reubicar(ids: string[], desde: number, hasta: number): string[] {
  const siguiente = [...ids]
  const [movido] = siguiente.splice(desde, 1)
  siguiente.splice(hasta, 0, movido)

  return siguiente
}

/**
 * Convierte una rejilla de tarjetas en una rejilla que se ordena a mano.
 *
 * El estado local es SOLO el orden, una lista de ids; las tarjetas se siguen
 * leyendo de `items` en cada render. Es lo que permite que ocultar una lista o
 * editarle el título se vea al instante sin deshacer el orden que se acaba de
 * arrastrar — si aquí se guardara una copia de las tarjetas, esos cambios se
 * quedarían congelados hasta la siguiente alta o baja.
 *
 * Mientras se arrastra, la tarjeta se mueve en cuanto se suelta y la petición
 * sale detrás. Si el servidor la rechaza —porque el otro padre acaba de añadir
 * algo desde su móvil— se devuelve todo a como estaba y se cuenta por qué.
 */
export function useOrdenable<T extends Ordenable>({
  items,
  nombreDe,
  onOrdenar,
}: {
  items: T[]
  /** Para el `aria-label` del tirador y para el aviso del lector de pantalla. */
  nombreDe: (item: T) => string
  /** Guarda el orden nuevo. Recibe todos los ids, del primero al último. */
  onOrdenar: (ids: string[]) => Promise<unknown>
}) {
  const [ids, setIds] = useState<string[]>(() => items.map((item) => item.id))
  /** El último orden que sabemos que tiene el servidor. Sirve para deshacer. */
  const [ordenGuardado, setOrdenGuardado] = useState<string[]>(ids)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [anuncio, setAnuncio] = useState('')

  const cajas = useRef(new Map<string, HTMLElement>())
  const refsDeCaja = useRef(new Map<string, RefCallback<HTMLElement>>())
  const arrastre = useRef<Arrastre | null>(null)
  const fotograma = useRef<number | null>(null)

  const porId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )

  // Firma del CONJUNTO de ids, no de su orden: está ordenada a propósito.
  const firma = useMemo(
    () =>
      items
        .map((item) => item.id)
        .sort()
        .join('|'),
    [items],
  )

  const [firmaVigente, setFirmaVigente] = useState(firma)

  // Se vuelve al orden del servidor solo cuando cambia el conjunto (se ha
  // creado o borrado algo), nunca cuando cambia su orden. Si se mirara el
  // orden, cada guardado correcto desharía lo que se acaba de arrastrar: la
  // pantalla sigue teniendo el `datos` de antes de la petición, porque a
  // propósito no se recarga para no provocar un parpadeo.
  //
  // Va durante el render y no en un useEffect por lo mismo que lo recomienda
  // React: así la rejilla nunca llega a pintarse con el orden viejo y luego
  // corregirse. Termina solo — al segundo pase las dos firmas ya coinciden.
  if (firma !== firmaVigente) {
    const delServidor = items.map((item) => item.id)

    setFirmaVigente(firma)
    setIds(delServidor)
    setOrdenGuardado(delServidor)
  }

  /** Las tarjetas ya ordenadas. Los ids que ya no existen se caen solos. */
  const orden = useMemo(
    () =>
      ids
        .map((id) => porId.get(id))
        .filter((item): item is T => item !== undefined),
    [ids, porId],
  )

  /**
   * Pega la tarjeta arrastrada al puntero.
   *
   * Mide su hueco real en la rejilla restando el desplazamiento que ya lleva
   * puesto, y de ahí saca el nuevo. Eso es lo que evita el salto cuando la
   * rejilla se reordena y le cambia el hueco debajo: el cálculo se rehace
   * contra el hueco nuevo en vez de arrastrar el de la posición inicial.
   *
   * Escribe en el DOM directamente en vez de pasar por el estado: son hasta
   * ciento veinte movimientos por segundo, y cada uno provocaría un render de
   * la rejilla entera.
   */
  const colocar = useCallback(() => {
    const actual = arrastre.current
    if (!actual) return

    const nodo = cajas.current.get(actual.id)
    if (!nodo) return

    const caja = nodo.getBoundingClientRect()
    const huecoX = caja.left - actual.dx
    const huecoY = caja.top - actual.dy

    actual.dx = actual.punteroX - actual.agarreX - huecoX
    actual.dy = actual.punteroY - actual.agarreY - huecoY

    nodo.style.transform = `translate(${actual.dx}px, ${actual.dy}px)`
  }, [])

  // Tras cada render con un arrastre en curso la rejilla puede haberse
  // recolocado. Esto corrige la posición ANTES de pintar, así que el salto no
  // llega a verse.
  useLayoutEffect(() => {
    if (arrastrando) colocar()
  })

  /** Sobre qué tarjeta está el puntero, sin contar la que va en la mano. */
  const tarjetaBajoElPuntero = useCallback(
    (x: number, y: number, excluida: string): string | null => {
      for (const [id, nodo] of cajas.current) {
        if (id === excluida) continue

        const caja = nodo.getBoundingClientRect()
        if (
          x >= caja.left &&
          x <= caja.right &&
          y >= caja.top &&
          y <= caja.bottom
        ) {
          return id
        }
      }

      return null
    },
    [],
  )

  const revisarDestino = useCallback(() => {
    const actual = arrastre.current
    if (!actual) return

    const destino = tarjetaBajoElPuntero(
      actual.punteroX,
      actual.punteroY,
      actual.id,
    )
    if (!destino) return

    setIds((previo) => {
      const desde = previo.indexOf(actual.id)
      const hasta = previo.indexOf(destino)
      if (desde === -1 || hasta === -1 || desde === hasta) return previo

      return reubicar(previo, desde, hasta)
    })
  }, [tarjetaBajoElPuntero])

  /**
   * Desplaza la página cuando el puntero se acerca a un borde.
   *
   * Sin esto, en el móvil no se puede llevar una tarjeta más allá de lo que se
   * ve: el dedo ya está ocupado arrastrando y no le queda con qué hacer scroll.
   */
  const arrancarAutoscroll = useCallback(() => {
    // El bucle se declara aquí dentro y no como otro useCallback porque se
    // llama a sí mismo: un hook que se referencia antes de terminar de
    // declararse es, con razón, un aviso del linter.
    const fotografiar = () => {
      const actual = arrastre.current
      if (!actual) return

      let paso = 0
      if (actual.punteroY < MARGEN_AUTOSCROLL) paso = -PASO_AUTOSCROLL
      else if (actual.punteroY > window.innerHeight - MARGEN_AUTOSCROLL) {
        paso = PASO_AUTOSCROLL
      }

      if (paso !== 0) {
        window.scrollBy(0, paso)
        // La página se ha movido bajo el puntero, así que la tarjeta y el
        // destino han cambiado sin que el dedo se moviera.
        colocar()
        revisarDestino()
      }

      fotograma.current = requestAnimationFrame(fotografiar)
    }

    fotograma.current = requestAnimationFrame(fotografiar)
  }, [colocar, revisarDestino])

  const guardar = useCallback(
    async (siguiente: string[]) => {
      // Arrastrar y soltar en el mismo sitio no es un cambio que guardar.
      if (siguiente.join('|') === ordenGuardado.join('|')) return

      setError(null)
      // Se da por bueno antes de preguntar: la tarjeta ya está donde la han
      // soltado, y hacerla esperar a la respuesta sería un parpadeo por cada
      // arrastre. Si el servidor dice que no, se deshace abajo.
      setOrdenGuardado(siguiente)

      try {
        await onOrdenar(siguiente)
      } catch (fallo) {
        setIds(ordenGuardado)
        setOrdenGuardado(ordenGuardado)
        setError(mensajeDeError(fallo))
      }
    },
    [onOrdenar, ordenGuardado],
  )

  const terminar = useCallback(() => {
    const actual = arrastre.current
    if (!actual) return

    const nodo = cajas.current.get(actual.id)
    if (nodo) nodo.style.transform = ''

    if (fotograma.current !== null) cancelAnimationFrame(fotograma.current)
    fotograma.current = null
    arrastre.current = null
    setArrastrando(null)

    // `ids` está al día: soltar es un evento aparte del de mover, así que los
    // cambios de posición del arrastre ya se han renderizado y este manejador
    // se ha vuelto a crear con el orden definitivo.
    void guardar(ids)
  }, [guardar, ids])

  // Si la pantalla se desmonta a mitad de arrastre, el bucle de autoscroll se
  // quedaría vivo pidiendo fotogramas para siempre.
  useEffect(
    () => () => {
      if (fotograma.current !== null) cancelAnimationFrame(fotograma.current)
    },
    [],
  )

  const refDeCaja = useCallback((id: string): RefCallback<HTMLElement> => {
    // Se memoriza por id: si se devolviera una función nueva en cada render,
    // React la desmontaría y volvería a montarla cada vez, y el mapa se
    // quedaría vacío justo en mitad de un arrastre.
    let guardada = refsDeCaja.current.get(id)

    if (!guardada) {
      guardada = (nodo) => {
        if (nodo) cajas.current.set(id, nodo)
        else cajas.current.delete(id)
      }
      refsDeCaja.current.set(id, guardada)
    }

    return guardada
  }, [])

  /** Con el teclado, sobre el tirador, las flechas mueven la tarjeta. */
  const moverConTeclado = useCallback(
    (id: string, salto: -1 | 1) => {
      const desde = ids.indexOf(id)
      const hasta = desde + salto

      if (desde === -1 || hasta < 0 || hasta >= ids.length) return

      const siguiente = reubicar(ids, desde, hasta)
      const item = porId.get(id)

      setIds(siguiente)
      if (item) {
        setAnuncio(`${nombreDe(item)}, posición ${hasta + 1} de ${ids.length}`)
      }
      void guardar(siguiente)
    },
    [guardar, ids, nombreDe, porId],
  )

  // Sin useCallback a propósito: se llama durante el render, así que su
  // identidad no importa, y memorizarla solo obligaría a arrastrar `nombreDe`
  // por las dependencias de media docena de funciones.
  function propsDeTirador(item: T): PropsDeTirador {
    return {
      onPointerDown: (evento) => {
        // Solo el botón principal del ratón; con dedo y lápiz siempre es 0.
        if (evento.button !== 0) return

        // Corta la selección de texto y el "arrastrar imagen" del navegador.
        evento.preventDefault()

        const nodo = cajas.current.get(item.id)
        if (!nodo) return

        const caja = nodo.getBoundingClientRect()

        arrastre.current = {
          id: item.id,
          punteroX: evento.clientX,
          punteroY: evento.clientY,
          agarreX: evento.clientX - caja.left,
          agarreY: evento.clientY - caja.top,
          dx: 0,
          dy: 0,
        }

        // La captura ata el puntero al tirador: a partir de aquí los eventos
        // siguen llegando a este botón aunque el dedo se salga de la tarjeta,
        // que es lo que ocurre en cuanto se mueve un poco.
        evento.currentTarget.setPointerCapture(evento.pointerId)

        setError(null)
        setArrastrando(item.id)
        arrancarAutoscroll()
      },

      onPointerMove: (evento) => {
        const actual = arrastre.current
        if (!actual || actual.id !== item.id) return

        actual.punteroX = evento.clientX
        actual.punteroY = evento.clientY

        colocar()
        revisarDestino()
      },

      onPointerUp: terminar,
      // Una llamada entrante, el gesto de "atrás" del sistema: el arrastre se
      // cancela, y la tarjeta tiene que quedarse donde esté, no en el limbo.
      onPointerCancel: terminar,

      onKeyDown: (evento) => {
        const salto =
          evento.key === 'ArrowUp' || evento.key === 'ArrowLeft'
            ? -1
            : evento.key === 'ArrowDown' || evento.key === 'ArrowRight'
              ? 1
              : 0

        if (salto === 0) return

        // Si no, las flechas desplazan la página bajo la tarjeta.
        evento.preventDefault()
        moverConTeclado(item.id, salto)
      },

      'aria-label': `Mover ${nombreDe(item)}. Con las flechas cambia de sitio.`,
      style: { touchAction: 'none' },
    }
  }

  return {
    /** Las tarjetas en el orden que toca pintar ahora mismo. */
    orden,
    /** Id de la que se está arrastrando, para resaltarla. */
    arrastrando,
    /** Lo que dijo el servidor cuando el guardado falló. */
    error,
    /** Ref para el envoltorio de cada tarjeta. Sin esto no hay nada que medir. */
    refDeCaja,
    /** Todo lo que necesita el botón del tirador. */
    propsDeTirador,
    /** Texto para una región `aria-live`, al mover con el teclado. */
    anuncio,
  }
}
