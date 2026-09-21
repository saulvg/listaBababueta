import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'

// Envoltorio de todo lo que ve la familia. La barra de arriba solo lleva el
// interruptor de tema: quien llega aquí viene de un enlace de WhatsApp a una
// lista concreta, y no necesita navegación.
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl justify-end px-4 py-4 sm:px-6">
        <ThemeToggle />
      </header>

      {children}

      {/* El aviso legal va en el pie de todas las páginas públicas, que es
          donde se busca, y en letra pequeña: nadie entra aquí a leerlo. */}
      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-center sm:px-6">
        <Link
          href="/aviso-legal"
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Aviso legal y privacidad
        </Link>
      </footer>
    </div>
  )
}
