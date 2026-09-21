import type { Metadata } from 'next'

/**
 * Lo que se lee en la vista previa al compartir el enlace de una lista por
 * WhatsApp, debajo del título.
 *
 * Dice a dónde lleva el enlace y avisa de que hace falta la clave, sin asomar
 * nada de lo que hay dentro. A propósito NO cuenta cuántos regalos hay ni
 * cuántos se han comprado: eso es contenido de la lista, y el contenido es
 * justo lo que protege la clave (CLAUDE.md §5). El título sí puede salir,
 * porque el índice de listas ya es público.
 */
export const AVISO_DE_CLAVE =
  'Regalos para Cacahueta. Necesitas la clave que te hemos dado.'

/** Lo que dice la app de sí misma cuando no estamos dentro de una lista. */
export const DESCRIPCION_GENERAL =
  'Listas de regalos para compartir con la familia'

/**
 * Los campos de Open Graph que no cambian de una página a otra, imagen
 * incluida.
 *
 * Hay que repetirlos en cada `generateMetadata` que defina su propio
 * `openGraph`, porque Next sustituye ese objeto entero en vez de fusionarlo
 * campo a campo.
 *
 * Por eso la imagen se declara aquí a mano en vez de dejarla en
 * `app/opengraph-image.png`, que sería la vía corta: ese fichero solo se
 * hereda mientras la página no defina su `openGraph`, y la página de la lista
 * tiene que definirlo para poner su título. Comprobado: con el fichero de
 * convención, `/lista/<slug>` salía SIN og:image — justo la página que más
 * se comparte. La imagen la genera `pnpm render:og`.
 */
export const OPEN_GRAPH_BASE = {
  type: 'website',
  siteName: 'Lista Bababueta',
  locale: 'es_ES',
  images: [
    {
      url: '/og.png',
      width: 1200,
      height: 630,
      alt: 'Un cacahuete sobre fondo azul, con el rótulo «Lista Bababueta — Regalos para Cacahueta»',
    },
  ],
} satisfies Metadata['openGraph']

/**
 * La URL pública, la misma variable que usan los correos de aviso de compra.
 *
 * Si falta, Next resuelve `og:image` contra localhost y WhatsApp no enseña
 * imagen ninguna. Falla en silencio, así que el sitio donde más duele
 * olvidarla es el despliegue.
 */
export const URL_PUBLICA =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'
