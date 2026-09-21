/**
 * Carrito de bebé, dibujado a mano en el estilo de lucide (trazo de 2,
 * extremos redondeados, lienzo de 24) porque lucide no trae ninguno: solo
 * tiene `Baby`, que es una cara.
 */
function Carrito({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* La capota va rellena: a este tamaño, a trazo suelto no se
          reconocería. */}
      <path d="M17 12a7 7 0 0 0-14 0Z" fill="currentColor" stroke="none" />
      <path d="M3 12h14" />
      <path d="m17 12 2.4-6" />
      <path d="M18 6h3" />
      <path d="M6 12v3.5" />
      <path d="M14 12v3.5" />
      <circle cx="6" cy="17.5" r="2" />
      <circle cx="14" cy="17.5" r="2" />
    </svg>
  )
}

/**
 * Pantalla de espera. Un carrito que va del punto A al punto B y vuelve,
 * dando botes, mientras se cargan los datos.
 *
 * No es un <dialog> ni atrapa el foco a propósito: no hay nada que pulsar
 * aquí dentro y robarle el foco a quien navega con teclado, para devolvérselo
 * medio segundo después, molesta más de lo que ayuda. Es una capa que tapa y
 * se anuncia con `role="status"`.
 *
 * Las animaciones van con `motion-safe:`: quien tenga puesto "reducir
 * movimiento" en su sistema ve el carrito quieto y el texto igual.
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
        {/* La pista: 12rem de ancho, el carrito ocupa 2 y recorre las 10 que
            quedan (--recorrido, que es lo que leen los fotogramas). */}
        <div className="relative h-10 w-48 [--recorrido:10rem]">
          <span className="absolute inset-x-0 bottom-0 border-b border-dashed" />
          <span className="absolute bottom-1 left-0 motion-safe:animate-paseo">
            <span className="block text-primary-ink motion-safe:animate-bache">
              <Carrito className="size-8" />
            </span>
          </span>
        </div>

        <p className="font-heading text-lg">{texto}</p>
      </div>
    </div>
  )
}
