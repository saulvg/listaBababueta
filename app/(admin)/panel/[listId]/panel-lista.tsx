'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { BackLink } from '@/components/back-link'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { GiftCard } from '@/components/gift-card'
import {
  contarRegalos,
  filtrarRegalos,
  GiftFilter,
  type Filtro,
} from '@/components/gift-filter'
import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import { api, esCodigo, mensajeDeError } from '@/lib/api/client'
import type { AdminListDetailResponse, Product } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'

import { DialogoProducto } from './dialogo-producto'

type Dialogo = { modo: 'crear' } | { modo: 'editar'; producto: Product }

export function PanelLista({ listId }: { listId: string }) {
  const router = useRouter()
  const { datos, error, cargando, recargar } = useApi<AdminListDetailResponse>(
    `/api/admin/lists/${encodeURIComponent(listId)}`,
  )

  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [aBorrar, setABorrar] = useState<Product | null>(null)
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  useEffect(() => {
    if (esCodigo(error, 'unauthorized')) router.replace('/entrar')
  }, [error, router])

  async function eliminar() {
    if (!aBorrar) return

    setBorrando(true)
    setErrorBorrado(null)

    try {
      await api.delete(`/api/admin/products/${aBorrar.id}`)
      setABorrar(null)
      recargar()
    } catch (fallo) {
      setErrorBorrado(mensajeDeError(fallo))
    } finally {
      setBorrando(false)
    }
  }

  const regalos = datos?.list.products ?? []
  const visibles = filtrarRegalos(regalos, filtro)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
      <BackLink href="/panel">Vuestras listas</BackLink>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{datos?.list.title ?? ' '}</h1>
        {datos && (
          <Button size="lg" onClick={() => setDialogo({ modo: 'crear' })}>
            <Plus aria-hidden />
            Añadir producto
          </Button>
        )}
      </header>

      {cargando && <Loader texto="Contando los regalos…" />}

      {error && !esCodigo(error, 'unauthorized') ? (
        <Notice>{mensajeDeError(error)}</Notice>
      ) : null}

      {datos && regalos.length > 0 && (
        <GiftFilter
          valor={filtro}
          onChange={setFiltro}
          conteos={contarRegalos(regalos)}
          className="mb-4"
        />
      )}

      {datos && visibles.length === 0 && filtro !== 'todos' && (
        <p className="text-sm text-muted-foreground">
          {filtro === 'comprados'
            ? 'Todavía no ha comprado nadie.'
            : 'Ya no queda ninguno sin comprar.'}
        </p>
      )}

      {datos && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((producto) => (
            <li key={producto.id} className="flex">
              <GiftCard
                product={producto}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="bg-background/80 backdrop-blur"
                      aria-label={`Editar ${producto.title}`}
                      onClick={() => setDialogo({ modo: 'editar', producto })}
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="bg-background/80 text-destructive backdrop-blur hover:text-destructive"
                      aria-label={`Eliminar ${producto.title}`}
                      onClick={() => {
                        setErrorBorrado(null)
                        setABorrar(producto)
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </>
                }
              />
            </li>
          ))}

          {/* La tarjeta de añadir solo cuando se ven todos: al final de una
              lista filtrada por "comprados" no pinta nada. */}
          {filtro === 'todos' && (
            <li>
              <button
                type="button"
                onClick={() => setDialogo({ modo: 'crear' })}
                className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground"
              >
                <Plus className="size-5" aria-hidden />
                Añadir producto
              </button>
            </li>
          )}
        </ul>
      )}

      {dialogo && (
        <DialogoProducto
          key={dialogo.modo === 'editar' ? dialogo.producto.id : 'nuevo'}
          listId={listId}
          producto={dialogo.modo === 'editar' ? dialogo.producto : undefined}
          open
          onOpenChange={(abierto) => !abierto && setDialogo(null)}
          onGuardado={() => {
            setDialogo(null)
            recargar()
          }}
          onEliminar={(producto) => {
            setDialogo(null)
            setErrorBorrado(null)
            setABorrar(producto)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(aBorrar)}
        onOpenChange={(abierto) => !abierto && setABorrar(null)}
        title={`¿Eliminar ${aBorrar?.title ?? 'el regalo'}?`}
        description={
          aBorrar?.status === 'COMPRADO'
            ? 'Alguien de la familia ya lo ha marcado como comprado. Si lo borras, esa marca desaparece con él.'
            : 'Desaparecerá de la lista que ve la familia. No se puede deshacer.'
        }
        confirmLabel="Eliminar regalo"
        onConfirm={eliminar}
        loading={borrando}
        error={errorBorrado}
      />
    </main>
  )
}
