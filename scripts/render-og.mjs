/**
 * Dibuja las tres imágenes de la marca a partir de `public/peanut.png`: la
 * vista previa que sale al pegar un enlace en WhatsApp, el icono de la
 * pestaña y el de iOS.
 *
 * Se ejecuta A MANO, no en cada build: `pnpm render:og`. Las tres se versionan
 * ya renderizadas porque son fijas — la vista previa es la misma para todas
 * las listas, que el nombre de cada una viaja en el título del enlace y no
 * dentro de la imagen —, y así el despliegue no depende ni de generar
 * imágenes en runtime ni de que Google Fonts conteste durante el build.
 *
 * Este script existe para que cambiar una palabra del rótulo, o el dibujo, no
 * obligue a abrir un editor gráfico. Necesita red la primera vez, para bajarse
 * la fuente; la deja cacheada en node_modules/.cache.
 */
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Con la extensión: esto lo ejecuta Node pelado, sin el resolutor de Next, y
// ahí `next/og` a secas no está en los exports del paquete.
import { ImageResponse } from 'next/og.js'
import React from 'react'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// La manuscrita de los titulares de la app. Se baja del repositorio oficial de
// Google Fonts; es OFL, así que se puede usar y redistribuir lo dibujado.
const URL_FUENTE =
  'https://github.com/google/fonts/raw/main/ofl/indieflower/IndieFlower-Regular.ttf'
const CACHE_FUENTE = path.join(
  RAIZ,
  'node_modules/.cache/indie-flower/IndieFlower-Regular.ttf',
)

// El dibujo de partida. El .webp de al lado es el mismo cacahuete y es el que
// se sirve en la pantalla de espera; el .png existe porque ni el icono de la
// app ni la vista previa pueden ir en webp (Next solo acepta ico/png/jpg/svg
// para el icono, y no todos los clientes de mensajería enseñan un webp).
const CACAHUETE = path.join(RAIZ, 'public/peanut.png')

// La vista previa va en public/ y no en app/opengraph-image.png porque esa
// convención solo se hereda mientras la página no declare su propio
// `openGraph`, y la de la lista lo declara para poner su título. Se nombra
// desde lib/metadata.ts, que explica el caso entero.
const SALIDA_OG = path.join(RAIZ, 'public/og.png')
const SALIDA_ICONO = path.join(RAIZ, 'app/icon.png')
const SALIDA_APPLE = path.join(RAIZ, 'app/apple-icon.png')

const TITULO = 'Lista Bababueta'
const SUBTITULO = 'Regalos para Cacahueta'

/**
 * Convierte un color oklch de `app/globals.css` a sRGB, que es lo que entiende
 * el motor que dibuja estas imágenes.
 *
 * Está aquí, y no el hexadecimal ya calculado, para poder copiar el valor tal
 * cual desde la hoja de estilos: si un día cambia el azul de la app, se pega
 * aquí el mismo oklch y las imágenes siguen haciendo juego, sin traducciones a
 * mano por el camino.
 */
function oklchASRgb(L, C, hGrados) {
  const h = (hGrados * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  // OKLab -> LMS (cúbica) -> RGB lineal, con las matrices de Björn Ottosson.
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  const lineales = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]

  const canales = lineales.map((valor) => {
    const acotado = Math.min(1, Math.max(0, valor))
    const gamma =
      acotado <= 0.0031308
        ? 12.92 * acotado
        : 1.055 * acotado ** (1 / 2.4) - 0.055
    return Math.round(gamma * 255)
  })

  return `rgb(${canales.join(', ')})`
}

// El mismo --primary de globals.css: el azul profundo de los botones.
const AZUL = oklchASRgb(0.42, 0.13, 259)

async function leerFuente() {
  if (existsSync(CACHE_FUENTE)) return fs.readFile(CACHE_FUENTE)

  const respuesta = await fetch(URL_FUENTE)
  if (!respuesta.ok) {
    throw new Error(
      `No se ha podido bajar Indie Flower (${respuesta.status}). Bájala a mano a ${CACHE_FUENTE} y vuelve a ejecutar.`,
    )
  }

  const datos = Buffer.from(await respuesta.arrayBuffer())
  await fs.mkdir(path.dirname(CACHE_FUENTE), { recursive: true })
  await fs.writeFile(CACHE_FUENTE, datos)
  return datos
}

/** Atajo para no escribir React.createElement veinte veces. */
const el = (estilo, hijos) =>
  React.createElement('div', { style: { display: 'flex', ...estilo } }, hijos)

const cacahuete = (lado) =>
  React.createElement('img', {
    key: 'cacahuete',
    src: fuente64,
    width: lado,
    height: lado,
  })

async function escribir(ruta, elemento, opciones) {
  const imagen = new ImageResponse(elemento, opciones)
  const datos = Buffer.from(await imagen.arrayBuffer())
  await fs.writeFile(ruta, datos)
  console.log(
    `${path.relative(RAIZ, ruta)} — ${opciones.width}x${opciones.height}, ${(datos.length / 1024).toFixed(1)} kB`,
  )
}

const fuente = await leerFuente()
const fuente64 = `data:image/png;base64,${(await fs.readFile(CACAHUETE)).toString('base64')}`
const fuentes = [
  { name: 'Indie Flower', data: fuente, style: 'normal', weight: 400 },
]

// --- La vista previa del enlace -------------------------------------------
// 1200x630 es la proporción que esperan WhatsApp y el resto. Todo centrado y
// con mucho aire: WhatsApp recorta los bordes en algunas pantallas.
await escribir(
  SALIDA_OG,
  el(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: AZUL,
      fontFamily: 'Indie Flower',
      color: 'white',
    },
    [
      // El dibujo trae mucho margen vacío dentro del propio fichero, así que
      // va grande y el título sube para recuperar ese aire de más.
      cacahuete(400),
      el(
        { key: 'titulo', fontSize: 104, marginTop: -40, lineHeight: 1.1 },
        TITULO,
      ),
      el({ key: 'sub', fontSize: 46, marginTop: 8, opacity: 0.85 }, SUBTITULO),
    ],
  ),
  { width: 1200, height: 630, fonts: fuentes },
)

// --- El icono de la pestaña ------------------------------------------------
// Sin fondo, para que se apoye en el color de la pestaña, y con el dibujo
// ampliado un 15%: el original deja mucho margen vacío y a 16 píxeles cada
// uno cuenta.
//
// 256 y no 512: nadie enseña un favicon a ese tamaño (el más grande que se
// usa es el de 192 de Android) y a 512 el fichero se iba a 138 kB, que es
// mucho para algo que se baja en cada primera visita.
await escribir(
  SALIDA_ICONO,
  el(
    {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cacahuete(295),
  ),
  { width: 256, height: 256 },
)

// --- El icono de iOS -------------------------------------------------------
// Este sí lleva fondo: iOS rellena de negro lo que sea transparente cuando
// alguien guarda la web en su pantalla de inicio.
await escribir(
  SALIDA_APPLE,
  el(
    {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: AZUL,
    },
    cacahuete(150),
  ),
  { width: 180, height: 180 },
)
