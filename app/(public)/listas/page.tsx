'use client'

import { Lock, LockOpen } from 'lucide-react'
import Link from 'next/link'

import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { mensajeDeError } from '@/lib/api/client'
import type { ListsResponse } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'

// Índice de listas. Enseña los TÍTULOS de todas, tenga o no clave quien mire:
// es una decisión, no un descuido (CLAUDE.md §5). Así un familiar que ha
// perdido el enlace entra, ve "Reyes 2026" y mete la clave, sin depender de
// que le reenvíen nada.
export default function ListasPage() {
  const { datos, error, cargando } = useApi<ListsResponse>('/api/public/lists')

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
      <header className="mb-8 space-y-1">
        <h1 className="text-3xl">Listas de regalos</h1>
        <p className="text-sm text-muted-foreground">
          Abre una lista con la clave que te compartimos.
        </p>
      </header>

      {cargando && <Loader />}

      {error ? <Notice>{mensajeDeError(error)}</Notice> : null}

      {datos && datos.lists.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no hay ninguna lista. Cuando se cree una, aparecerá aquí.
        </p>
      )}

      {datos && datos.lists.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {datos.lists.map((lista) => (
            <li key={lista.id}>
              <Link
                href={`/lista/${lista.slug}`}
                className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-heading text-xl">{lista.title}</span>
                  {lista.unlocked ? (
                    <LockOpen
                      className="mt-1 size-4 shrink-0 text-success"
                      // El candado no es decorativo: es la única señal de si
                      // hará falta la clave al entrar.
                      aria-label="Ya tienes acceso"
                    />
                  ) : (
                    <Lock
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                      aria-label="Necesita clave"
                    />
                  )}
                </span>

                <span className="text-sm text-muted-foreground">
                  {lista.productCount === 1
                    ? '1 regalo'
                    : `${lista.productCount} regalos`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
