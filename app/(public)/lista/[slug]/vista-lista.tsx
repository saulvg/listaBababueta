'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AccessGate } from '@/components/access-gate'
import { BackLink } from '@/components/back-link'
import { GiftCard } from '@/components/gift-card'
import {
  contarRegalos,
  filtrarRegalos,
  GiftFilter,
  type Filtro,
} from '@/components/gift-filter'
import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { buttonVariants } from '@/components/ui/button'
import { esCodigo, mensajeDeError } from '@/lib/api/client'
import type { PublicListResponse } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'
import { cn } from '@/lib/utils'

/** "3 regalos · 1 comprado". El segundo trozo solo cuando hay alguno. */
function resumen(total: number, comprados: number): string {
  const regalos = total === 1 ? '1 regalo' : `${total} regalos`
  return comprados > 0
    ? `${regalos} · ${comprados} comprado${comprados === 1 ? '' : 's'}`
    : regalos
}

/** Qué decir cuando el filtro no deja nada en pantalla. */
const SIN_RESULTADOS: Record<Filtro, string> = {
  todos: 'Esta lista todavía no tiene regalos.',
  disponibles: '¡Ya está todo comprado!',
  comprados: 'Todavía no ha comprado nadie.',
}

export function VistaLista({ slug }: { slug: string }) {
  const { datos, error, cargando, recargar } = useApi<PublicListResponse>(
    `/api/public/lists/${encodeURIComponent(slug)}`,
  )
  const [filtro, setFiltro] = useState<Filtro>('todos')

  // 403 `list_locked` no es una pantalla de error: es la puerta. La API lo
  // distingue del resto justo para esto.
  if (esCodigo(error, 'list_locked')) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <BackLink href="/listas">Todas las listas</BackLink>
        <AccessGate slug={slug} onUnlocked={recargar} />
      </main>
    )
  }

  const regalos = datos?.products ?? []
  const visibles = filtrarRegalos(regalos, filtro)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
      {cargando && <Loader texto="Sacando los regalos del carrito…" />}

      {error && !cargando ? (
        <div className="space-y-4">
          <Notice>{mensajeDeError(error)}</Notice>
          <Link
            href="/listas"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver todas las listas
          </Link>
        </div>
      ) : null}

      {datos && (
        <>
          <BackLink href="/listas">Todas las listas</BackLink>

          <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b pb-6">
            <div>
              <p className="text-sm text-muted-foreground">Lista de deseos</p>
              <h1 className="text-4xl">{datos.list.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {resumen(
                regalos.length,
                regalos.filter((producto) => producto.status === 'COMPRADO')
                  .length,
              )}
            </p>
          </header>

          {regalos.length > 0 && (
            <GiftFilter
              valor={filtro}
              onChange={setFiltro}
              conteos={contarRegalos(regalos)}
              className="mb-4"
            />
          )}

          {visibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {regalos.length === 0
                ? SIN_RESULTADOS.todos
                : SIN_RESULTADOS[filtro]}
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((producto) => (
                <li key={producto.id} className="flex">
                  <GiftCard
                    product={producto}
                    href={`/lista/${slug}/${producto.id}`}
                    footer={
                      producto.status === 'DISPONIBLE' ? (
                        // Un <span> y no un <button>: la tarjeta entera ya es
                        // el enlace, y meter un botón dentro sería anidar dos
                        // cosas pulsables una encima de otra.
                        <span
                          className={cn(
                            buttonVariants({ size: 'lg' }),
                            'w-full',
                          )}
                        >
                          Ver detalle
                        </span>
                      ) : null
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
