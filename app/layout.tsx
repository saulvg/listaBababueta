import type { Metadata } from 'next'
import { Geist, Geist_Mono, Indie_Flower } from 'next/font/google'
import './globals.css'

import {
  DESCRIPCION_GENERAL,
  OPEN_GRAPH_BASE,
  URL_PUBLICA,
} from '@/lib/metadata'
import { SCRIPT_DE_TEMA } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Los titulares, manuscritos. Un solo grosor, como la anterior.
const indieFlower = Indie_Flower({
  variable: '--font-indie-flower',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  // Sin esto las URLs de la vista previa salen relativas, y WhatsApp, que no
  // las resuelve, no enseña imagen. Sale de NEXT_PUBLIC_APP_URL: si falta en
  // el despliegue, apunta a localhost y la vista previa se queda muda.
  metadataBase: new URL(URL_PUBLICA),
  title: {
    default: 'Lista Bababueta',
    // Cada página pone solo lo suyo ("Reyes 2026") y el sufijo lo añade esto.
    template: '%s · Lista Bababueta',
  },
  description: DESCRIPCION_GENERAL,
  openGraph: {
    ...OPEN_GRAPH_BASE,
    title: 'Lista Bababueta',
    description: DESCRIPCION_GENERAL,
    url: '/',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      // El script de abajo toca la clase del <html> antes de que React
      // hidrate, así que el aviso de "esto no coincide con el servidor" es
      // esperado y hay que callarlo aquí.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${indieFlower.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica el tema antes del primer pintado: sin esto, quien tenga el
            modo oscuro puesto ve un fogonazo blanco en cada carga. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
