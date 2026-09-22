'use client'

import { Move, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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
import { useOrdenable } from '@/lib/hooks/use-ordenable'
import { cn } from '@/lib/utils'

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

  const guardarOrden = useCallback(
    (ids: string[]) =>
      api.patch(
        `/api/admin/lists/${encodeURIComponent(listId)}/products/order`,
        { ids },
      ),
    [listId],
  )

  const {
    orden,
    arrastrando,
    error: errorOrden,
    refDeCaja,
    propsDeTirador,
    anuncio,
  } = useOrdenable<Product>({
    items: datos?.list.products ?? [],
    nombreDe: (producto) => producto.title,
    onOrdenar: guardarOrden,
  })

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

  // Solo se reordena con la lista entera a la vista. Con un filtro puesto, el
  // hueco donde se suelta una tarjeta no dice dónde cae de verdad: entre las
  // dos que se ven puede haber tres que no, y el regalo acabaría en un sitio
  // que nadie ha elegido.
  const sePuedeOrdenar = filtro === 'todos' && orden.length > 1
  const visibles = filtrarRegalos(orden, filtro)

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

      {errorOrden ? <Notice className="mb-4">{errorOrden}</Notice> : null}

      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {datos && orden.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <GiftFilter
            valor={filtro}
            onChange={setFiltro}
            conteos={contarRegalos(orden)}
          />

          {filtro !== 'todos' && orden.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Para cambiarlos de orden, vuelve a «Todos».
            </p>
          )}
        </div>
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
            <li
              key={producto.id}
              ref={refDeCaja(producto.id)}
              className={cn(
                'relative flex',
                arrastrando === producto.id &&
                  'z-20 cursor-grabbing select-none *:shadow-lg *:ring-2 *:ring-ring/50',
              )}
            >
              <GiftCard
                product={producto}
                actions={
                  <>
                    {sePuedeOrdenar && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-grab bg-background/80 text-muted-foreground backdrop-blur active:cursor-grabbing"
                        {...propsDeTirador(producto)}
                      >
                        <Move aria-hidden />
                      </Button>
                    )}
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
