import { PanelLista } from './panel-lista'

// Los regalos de una lista, vistos por los padres. La URL va por id y no por
// slug: aquí no hay nada que compartir, y el id es lo que piden los endpoints
// de administración.
export default async function PanelListaPage({
  params,
}: PageProps<'/panel/[listId]'>) {
  const { listId } = await params

  return <PanelLista listId={listId} />
}
