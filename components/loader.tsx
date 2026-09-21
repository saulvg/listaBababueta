/**
 * Pantalla de espera. Cacahueta yendo del punto A al punto B y volviendo, a
 * tumbos, mientras se cargan los datos.
 *
 * Es el mismo cacahuete que hace de icono de la app, servido desde `public/`
 * como los emojis de la portada: sin terceros de por medio (ver
 * /aviso-legal). Aquí va en webp, que pesa la mitad que el png; el png existe
 * igualmente porque el icono de la pestaña y la vista previa de WhatsApp no
 * admiten webp (ver scripts/render-og.mjs).
 *
 * Va con `<img>` y no con `next/image` porque son 16 kB que queremos servidos
 * tal cual y de inmediato — es justo la imagen que aparece cuando algo está
 * tardando, así que pasarla por el optimizador para ahorrar unos bytes sería
 * pagar una petición extra en el peor momento.
 *
 * No es un <dialog> ni atrapa el foco a propósito: no hay nada que pulsar
 * aquí dentro y robarle el foco a quien navega con teclado, para devolvérselo
 * medio segundo después, molesta más de lo que ayuda. Es una capa que tapa y
 * se anuncia con `role="status"`.
 *
 * Las animaciones van con `motion-safe:`: quien tenga puesto "reducir
 * movimiento" en su sistema lo ve quieto y el texto igual.
 */
export function Loader({
  texto = 'Bababueta está llegando…',
}: {
  texto?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-5 rounded-2xl border bg-card p-6 text-center">
        {/* La pista: 12rem de ancho, el cacahuete ocupa 2 y recorre las 10 que
            quedan (--recorrido, que es lo que leen los fotogramas). */}
        <div className="relative h-10 w-48 [--recorrido:10rem]">
          <span className="absolute inset-x-0 bottom-0 border-b border-dashed" />
          <span className="absolute bottom-1 left-0 motion-safe:animate-paseo">
            <span className="block motion-safe:animate-bache">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/peanut.webp"
                alt=""
                aria-hidden
                width={32}
                height={32}
                fetchPriority="high"
                className="size-8"
              />
            </span>
          </span>
        </div>

        <p className="font-heading text-lg">{texto}</p>
      </div>
    </div>
  )
}
