import type { Metadata } from 'next'

import { BackLink } from '@/components/back-link'

// ⚠️ PON AQUÍ EL CORREO DE CONTACTO antes de desplegar. Es el único dato que
// falta y el único sitio donde hay que cambiarlo.
const CONTACTO = 'saulvgproyecto@gmail.com'

const ACTUALIZADO = 'septiembre de 2026'

export const metadata: Metadata = {
  title: 'Aviso legal y privacidad · Lista Bababueta',
  description: 'Qué se guarda en esta web, para qué y a quién escribir.',
  // Es una página de trámite: que no salga en Google.
  robots: { index: false, follow: true },
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl">{titulo}</h2>
      {children}
    </section>
  )
}

/**
 * Aviso legal y privacidad.
 *
 * No hay aviso de cookies porque no hace falta: las tres cosas que esta web
 * guarda en el navegador son técnicas — sesión, acceso a las listas y el modo
 * claro/oscuro — y las técnicas están exentas de consentimiento (art. 22.2
 * LSSI). No hay analítica, ni publicidad, ni scripts de terceros.
 */
export default function AvisoLegalPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
      <BackLink href="/">Volver</BackLink>

      <h1 className="mb-2 text-3xl">Aviso legal y privacidad</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Última actualización: {ACTUALIZADO}
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <Seccion titulo="Qué es esto">
          <p>
            Una web privada de una familia para compartir listas de regalos y
            que nadie compre dos veces lo mismo. No se vende nada, no hay
            publicidad y no se gana dinero con ella.
          </p>
          <p>
            Para cualquier cosa relacionada con esta página, incluido pedir que
            se borre algo:{' '}
            <a
              href={`mailto:${CONTACTO}`}
              className="underline underline-offset-4"
            >
              {CONTACTO}
            </a>
            .
          </p>
        </Seccion>

        <Seccion titulo="Qué se guarda">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Las listas y los regalos</strong> que escriben los padres:
              título, enlace a la tienda, precio aproximado, comentario e
              imagen.
            </li>
            <li>
              <strong>El nombre que escribes al marcar un regalo</strong>, si lo
              escribes. Es opcional y es texto libre: puedes poner &laquo;la tía
              Marta&raquo;, un apodo o nada. Si lo dejas vacío, no se guarda
              ningún nombre.
            </li>
            <li>
              <strong>Tu dirección IP</strong>, solo en la memoria del servidor
              y durante unos minutos, para frenar a quien intente adivinar la
              clave de una lista probando una detrás de otra. No se escribe en
              ninguna base de datos y desaparece sola.
            </li>
          </ul>
          <p>
            No se pide ni se guarda nada más: ni tu correo, ni tu teléfono, ni
            tu nombre real.
          </p>
        </Seccion>

        <Seccion titulo="Quién lo ve">
          <p>
            El contenido de cada lista lo ve quien tenga su clave de acceso. Los
            títulos de las listas sí se ven sin clave, para que quien haya
            perdido el enlace pueda encontrar la suya; lo de dentro, no.
          </p>
          <p>
            Los datos no se venden ni se ceden a nadie. Los tres servicios que
            hacen falta para que la web funcione sí los tratan por encargo:{' '}
            <strong>Vercel</strong> (alojamiento), <strong>Neon</strong> (base
            de datos) y <strong>Resend</strong>, que envía un correo a los
            padres cuando alguien marca un regalo como comprado. Nada de
            analítica, seguimiento ni publicidad.
          </p>
        </Seccion>

        <Seccion titulo="Imágenes de las tiendas">
          <p>
            Las fotos de los regalos no están alojadas aquí: son las de la
            tienda correspondiente. Al abrir una lista, tu navegador se las pide
            directamente a esa tienda, que verá tu dirección IP como en
            cualquier otra visita a su web.
          </p>
        </Seccion>

        <Seccion titulo="Cookies">
          <p>
            Esta web usa tres cosas del navegador, y las tres son técnicas: sin
            ellas no funcionaría. Por eso no verás un aviso de cookies pidiendo
            permiso — las técnicas están exentas.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>bababueta_invitado</strong>: recuerda de qué listas has
              acertado la clave, para no pedírtela en cada página. Dura 30 días.
            </li>
            <li>
              <strong>bababueta_padres</strong>: la sesión de los padres en su
              panel. Dura 7 días.
            </li>
            <li>
              <strong>bababueta-tema</strong>: si prefieres el modo claro o el
              oscuro. Se queda en tu navegador y no sale de ahí.
            </li>
          </ul>
          <p>
            Puedes borrarlas cuando quieras desde tu navegador. Si lo haces,
            tendrás que volver a meter la clave de la lista.
          </p>
        </Seccion>

        <Seccion titulo="Tus derechos">
          <p>
            Puedes pedir ver, corregir o borrar lo que haya sobre ti escribiendo
            a{' '}
            <a
              href={`mailto:${CONTACTO}`}
              className="underline underline-offset-4"
            >
              {CONTACTO}
            </a>
            . En la práctica lo único que puede haber es el nombre que
            escribiste al marcar un regalo, y se borra en cuanto lo pidas.
            También puedes pedir que te digamos qué hay antes de decidir.
          </p>
          <p>
            Si crees que algo no se está haciendo bien, puedes reclamar ante la
            Agencia Española de Protección de Datos (aepd.es).
          </p>
        </Seccion>
      </div>
    </main>
  )
}
