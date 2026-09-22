import { HomeLink } from '@/components/home-link'
import { ThemeToggle } from '@/components/theme-toggle'

import { BotonSalir } from './boton-salir'

// Envoltorio del panel de los padres. Misma barra que la parte pública: el
// inicio a un lado y lo demás al otro. Aquí el botón de inicio es el puente a
// la otra cara de la app — es por donde se llega a /listas, que es donde se ve
// lo que ve la familia.
export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-4 sm:px-6">
        <HomeLink />

        <div className="ml-auto flex items-center gap-1">
          <BotonSalir />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  )
}
