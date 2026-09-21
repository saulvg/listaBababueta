import { Gift } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { EmojiBilletes } from './emoji-billetes'
import { TituloSecreto } from './titulo-secreto'

// Portada. Dos caminos, con pesos muy distintos a propósito: el de la familia
// es un botón que ocupa media pantalla, y el de los padres, un enlace pequeño
// debajo. Solo entran dos personas por el segundo.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 pb-24 text-center sm:px-6">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Gift className="size-7" aria-hidden />
      </span>

      <div className="space-y-3">
        <TituloSecreto />
        <p className="text-balance text-muted-foreground">
          Nuestras listas de cosas para Cacahueta.
          <br />
          Puedes cotillear lo que hemos considerado que va a necesitar 👀. Es
          solo una guía por si te apetece regalarle algo. <br /> Si ves algo que
          te hace ilusión adelante
          <EmojiBilletes />
          <br /> <br />
          <span className="font-bold text-warning">IMPORTANTE:</span> Marca como
          comprado una vez te decidas, antes incluso de haberlo comprado asi si
          alguien a decidio lo mismo que tu, no podra repetirlo.
        </p>
      </div>

      <Link
        href="/listas"
        className={cn(buttonVariants({ size: 'xl' }), 'w-full')}
      >
        Ver las listas
      </Link>

      <Link
        href="/entrar"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Acceso de padres
      </Link>
    </main>
  )
}
