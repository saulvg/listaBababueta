import { Check } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ProductImage } from '@/components/product-image'
import type { Product } from '@/lib/api/types'
import { formatearPrecio } from '@/lib/format/price'
import { cn } from '@/lib/utils'

/** "Comprado por Marta", o "Comprado" a secas si la compra fue anónima. */
export function textoDeCompra(product: Product): string {
  return product.purchasedBy
    ? `Comprado por ${product.purchasedBy}`
    : 'Comprado'
}

type GiftCardProps = {
  product: Product
  /** Si se pasa, la tarjeta entera es un enlace al detalle. */
  href?: string
  /** Botones de los padres, flotando arriba a la derecha. */
  actions?: ReactNode
  /** Pie de la tarjeta: el "Ver detalle" de la familia. */
  footer?: ReactNode
}

/**
 * Tarjeta de un regalo. La usan las dos caras de la app — la familia y el
 * panel — porque lo que enseñan es lo mismo; lo que cambia son los botones,
 * y esos entran por `actions` y `footer`.
 *
 * Un regalo comprado no se esconde ni se manda al final: se queda en su sitio,
 * apagado y con el nombre de quien lo compró. Ver quién compró qué es
 * exactamente para lo que existe la app.
 */
export function GiftCard({ product, href, actions, footer }: GiftCardProps) {
  const comprado = product.status === 'COMPRADO'
  const precio = formatearPrecio(product.priceCents)

  const contenido = (
    <>
      <ProductImage
        src={product.imageUrl}
        alt=""
        className={cn('aspect-square w-full', comprado && 'opacity-40')}
      />

      <div className="mt-3 flex-1 space-y-1">
        <h3
          className={cn(
            'font-sans text-base font-medium',
            comprado && 'text-muted-foreground',
          )}
        >
          {product.title}
        </h3>

        {comprado ? (
          <p className="flex items-center gap-1 text-sm text-success">
            <Check className="size-3.5 shrink-0" aria-hidden />
            {textoDeCompra(product)}
          </p>
        ) : (
          precio && <p className="text-sm text-muted-foreground">{precio}</p>
        )}
      </div>

      {footer && <div className="mt-3">{footer}</div>}
    </>
  )

  const clases = cn(
    'relative flex w-full flex-col rounded-xl border bg-card p-3 text-card-foreground transition-colors',
    href && 'hover:border-ring/60',
  )

  if (!href) {
    return (
      <div className={clases}>
        {contenido}
        {actions && (
          <div className="absolute top-2 right-2 flex gap-1">{actions}</div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        clases,
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
      )}
    >
      {contenido}
    </Link>
  )
}
