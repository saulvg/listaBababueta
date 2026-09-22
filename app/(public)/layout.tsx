import Link from 'next/link'

import { HomeLink } from '@/components/home-link'
import { ThemeToggle } from '@/components/theme-toggle'

// Envoltorio de todo lo que ve la familia. La barra de arriba lleva el inicio
// a un lado y el tema al otro; el porqué de que haga falta navegar está en
// components/home-link.tsx.
export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-4 sm:px-6">
        <HomeLink />

        <div className="ml-auto">
          <ThemeToggle />
        </div>
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
