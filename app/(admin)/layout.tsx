import { ThemeToggle } from '@/components/theme-toggle'

import { BotonSalir } from './boton-salir'

// Envoltorio del panel de los padres.
export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-end gap-1 px-4 py-4 sm:px-6">
        <BotonSalir />
        <ThemeToggle />
      </header>
      {children}
    </div>
  )
}
