import { Loader } from '@/components/loader'

// Propio y no heredado del de la lista, aunque pinte lo mismo: cada segmento
// dinámico necesita su frontera para preobtenerse por su cuenta. Ver
// lista/[slug]/loading.tsx para el porqué de todo esto.
export default function Cargando() {
  return <Loader />
}
