import { Loader } from '@/components/loader'

// Misma razón que en la parte pública (ver lista/[slug]/loading.tsx): la ruta
// es dinámica, y sin esto no se preobtiene ni da señal al pulsar.
export default function Cargando() {
  return <Loader />
}
