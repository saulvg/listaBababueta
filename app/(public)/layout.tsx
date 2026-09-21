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
    </div>
  )
}
