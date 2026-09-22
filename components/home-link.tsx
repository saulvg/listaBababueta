'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomeLink() {
  const ruta = usePathname()

  if (ruta === '/') return null

  return (
    <Link
      href="/"

      aria-label="Ir al inicio"
      title="Ir al inicio"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'icon-lg' }),

        'size-11 rounded-full',
      )}
    >
      <Home className="size-5" aria-hidden />
    </Link>
  )
}
