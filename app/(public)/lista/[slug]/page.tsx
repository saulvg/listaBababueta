import type { Metadata } from 'next'

import { findListBySlug } from '@/lib/lists/queries'
import { AVISO_DE_CLAVE, OPEN_GRAPH_BASE } from '@/lib/metadata'

import { VistaLista } from './vista-lista'

/**
 * La vista previa del enlace compartido: "Reyes 2026 · Lista Bababueta".
 *
 * Es la puerta de entrada de la app — casi todo el mundo llega por un enlace
 * pegado en WhatsApp —, así que el título tiene que decir de qué lista se
 * trata. Leer el título aquí no se salta la clave: los títulos ya son
 * públicos en /listas (CLAUDE.md §5), y lo que la clave protege, los
 * regalos, sigue pidiendo la clave.
 *
 * La imagen es la misma para todas las listas y la pone `opengraph-image.png`
 * sin que haya que nombrarla.
 */
export async function generateMetadata({
  params,
}: PageProps<'/lista/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const lista = await findListBySlug(slug)

  if (!lista) {
    return { title: 'Esa lista no existe' }
  }

  return {
    title: lista.title,
    description: AVISO_DE_CLAVE,
    openGraph: {
      ...OPEN_GRAPH_BASE,
      title: `${lista.title} · Lista Bababueta`,
      description: AVISO_DE_CLAVE,
      url: `/lista/${lista.slug}`,
    },
  }
}

// La página solo desenvuelve el slug de la URL; el trabajo lo hace el
// componente de cliente, que es quien habla con la API.
export default async function ListaPage({
  params,
}: PageProps<'/lista/[slug]'>) {
  const { slug } = await params

  return <VistaLista slug={slug} />
}
