import { VistaRegalo } from './vista-regalo'

// El detalle de un regalo tiene URL propia para que se pueda compartir tal
// cual por WhatsApp ("mira este"). Quien la abre sin haber pasado por la lista
// se encuentra con la pantalla de la clave, igual que en la lista.
export default async function RegaloPage({
  params,
}: PageProps<'/lista/[slug]/[productId]'>) {
  const { slug, productId } = await params

  return <VistaRegalo slug={slug} productId={productId} />
}
