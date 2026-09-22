import { Loader } from '@/components/loader'

// Sin este fichero, Next no preobtiene la ruta (es dinámica) y al pulsar se
// queda en la pantalla anterior, congelada, hasta que contesta el servidor.
// El Loader que sale aquí es el mismo que pinta vista-lista.tsx mientras pide
// los datos, así que el relevo entre los dos no se nota.
export default function Cargando() {
  return <Loader />
}
