import { VistaLista } from './vista-lista'

// La página solo desenvuelve el slug de la URL; el trabajo lo hace el
// componente de cliente, que es quien habla con la API.
export default async function ListaPage({
  params,
}: PageProps<'/lista/[slug]'>) {
  const { slug } = await params

  return <VistaLista slug={slug} />
}
