'use client'

import { Check, Eye, EyeOff, Move, Link2, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import { api, esCodigo, mensajeDeError } from '@/lib/api/client'
import type { AdminList, AdminListsResponse } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'
import { useOrdenable } from '@/lib/hooks/use-ordenable'
import { cn } from '@/lib/utils'

import { DialogoLista } from './dialogo-lista'

type Dialogo = { modo: 'crear' } | { modo: 'editar'; lista: AdminList }

/** "3 regalos · 1 comprado" */
function resumen(lista: AdminList): string {
  const regalos =
    lista.productCount === 1 ? '1 regalo' : `${lista.productCount} regalos`

  return lista.purchasedCount > 0
    ? `${regalos} · ${lista.purchasedCount} comprado${lista.purchasedCount === 1 ? '' : 's'}`
    : regalos
}

export default function PanelPage() {
  const router = useRouter()
  const { datos, error, cargando, recargar } =
    useApi<AdminListsResponse>('/api/admin/lists')

  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [aBorrar, setABorrar] = useState<AdminList | null>(null)
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [copiada, setCopiada] = useState<string | null>(null)
  const [ocultando, setOcultando] = useState<string | null>(null)
  const [errorVisibilidad, setErrorVisibilidad] = useState<string | null>(null)

  const guardarOrden = useCallback(
    (ids: string[]) => api.patch('/api/admin/lists/order', { ids }),
    [],
  )

  const {
    orden,
    arrastrando,
    error: errorOrden,
    refDeCaja,
    propsDeTirador,
    anuncio,
  } = useOrdenable<AdminList>({
    items: datos?.lists ?? [],
    nombreDe: (lista) => lista.title,
    onOrdenar: guardarOrden,
  })

  // La sesión caduca a los 7 días, así que esto pasa de verdad: el 401 manda
  // al login en vez de dejar una pantalla vacía con un error.
  useEffect(() => {
    if (esCodigo(error, 'unauthorized')) router.replace('/entrar')
  }, [error, router])

  async function copiarEnlace(slug: string) {
    // El origen se lee al pulsar, no al pintar: así el HTML del servidor y el
    // del navegador son iguales y no hay desajuste de hidratación.
    const enlace = `${window.location.origin}/lista/${slug}`

    try {
      await navigator.clipboard.writeText(enlace)
      setCopiada(slug)
      setTimeout(() => setCopiada(null), 2000)
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS) no se puede copiar; el
      // enlace se ve en pantalla y siempre se puede seleccionar a mano.
    }
  }

  /**
   * Ocultar o volver a enseñar una lista, de un toque y sin confirmación: se
   * deshace con el mismo botón. Lo que no puede faltar es la señal de en qué
   * estado ha quedado, y de eso se encargan el borde discontinuo y la etiqueta
   * "Oculta" de la tarjeta.
   */
  async function alternarVisibilidad(lista: AdminList) {
    setOcultando(lista.id)
    setErrorVisibilidad(null)

    try {
      await api.patch(`/api/admin/lists/${lista.id}`, { hidden: !lista.hidden })
      recargar()
    } catch (fallo) {
      setErrorVisibilidad(mensajeDeError(fallo))
    } finally {
      setOcultando(null)
    }
  }

  async function eliminar() {
    if (!aBorrar) return

    setBorrando(true)
    setErrorBorrado(null)

    try {
      await api.delete(`/api/admin/lists/${aBorrar.id}`)
      setABorrar(null)
      recargar()
    } catch (fallo) {
      setErrorBorrado(mensajeDeError(fallo))
    } finally {
      setBorrando(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Vuestras listas</h1>
        <Button size="lg" onClick={() => setDialogo({ modo: 'crear' })}>
          <Plus aria-hidden />
          Nueva lista
        </Button>
      </header>

      {cargando && <Loader texto="Abriendo vuestras listas…" />}

      {error && !esCodigo(error, 'unauthorized') ? (
        <Notice>{mensajeDeError(error)}</Notice>
      ) : null}

      {errorOrden ? <Notice className="mb-4">{errorOrden}</Notice> : null}
      {errorVisibilidad ? (
        <Notice className="mb-4">{errorVisibilidad}</Notice>
      ) : null}

      {/* Al mover con el teclado no hay nada que ver, así que hay que decirlo. */}
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {datos && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orden.map((lista) => (
            <li
              key={lista.id}
              ref={refDeCaja(lista.id)}
              className={cn(
                'relative',
                // El desplazamiento lo escribe el hook en el propio nodo, no
                // se pinta desde aquí (ver use-ordenable.ts).
                arrastrando === lista.id && 'z-20 cursor-grabbing',
              )}
            >
              <div
                className={cn(
                  'flex h-full flex-col gap-2 rounded-xl border bg-card p-4',
                  // Discontinuo = no lo ve la familia. Se lee de un vistazo
                  // desde el otro lado de la pantalla, que es lo que hace
                  // falta para no confundirse de lista.
                  lista.hidden && 'border-dashed bg-muted/30',
                  arrastrando === lista.id &&
                    'shadow-lg ring-2 ring-ring/50 select-none',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/panel/${lista.id}`}
                    className="font-heading text-xl hover:underline"
                  >
                    {lista.title}
                  </Link>

                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-grab text-muted-foreground active:cursor-grabbing"
                      {...propsDeTirador(lista)}
                    >
                      <Move aria-hidden />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={ocultando === lista.id}
                      // El icono enseña la ACCIÓN y no el estado: el estado ya
                      // lo cuentan el borde y la etiqueta, y así el botón dice
                      // lo que va a pasar si se pulsa.
                      aria-label={
                        lista.hidden
                          ? `Volver a enseñar ${lista.title} a la familia`
                          : `Ocultar ${lista.title} a la familia`
                      }
                      title={
                        lista.hidden
                          ? 'Volver a enseñarla a la familia'
                          : 'Ocultarla a la familia: dejará de verse también por su enlace'
                      }
                      onClick={() => alternarVisibilidad(lista)}
                    >
                      {lista.hidden ? (
                        <Eye aria-hidden />
                      ) : (
                        <EyeOff aria-hidden />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${lista.title}`}
                      onClick={() => setDialogo({ modo: 'editar', lista })}
                    >
                      <Pencil aria-hidden />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {resumen(lista)}
                </p>

                {lista.hidden && (
                  <p className="inline-flex w-fit items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <EyeOff className="size-3.5 shrink-0" aria-hidden />
                    Oculta a la familia
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => copiarEnlace(lista.slug)}
                  className="mt-auto inline-flex items-center gap-1.5 pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
                  title="Copiar el enlace para la familia"
                >
                  {copiada === lista.slug ? (
                    <>
                      <Check
                        className="size-3.5 shrink-0 text-success"
                        aria-hidden
                      />
                      Enlace copiado
                    </>
                  ) : (
                    <>
                      <Link2 className="size-3.5 shrink-0" aria-hidden />
                      /lista/{lista.slug}
                    </>
                  )}
                </button>
              </div>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={() => setDialogo({ modo: 'crear' })}
              className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground"
            >
              <Plus className="size-5" aria-hidden />
              {orden.length === 0
                ? 'Crear la primera lista'
                : 'Crear otra lista'}
            </button>
          </li>
        </ul>
      )}

      {dialogo && (
        <DialogoLista
          // Monta el formulario de cero por cada lista: sin esto, al abrir una
          // segunda lista seguirían dentro los valores de la primera.
          key={dialogo.modo === 'editar' ? dialogo.lista.id : 'nueva'}
          lista={dialogo.modo === 'editar' ? dialogo.lista : undefined}
          open
          onOpenChange={(abierto) => !abierto && setDialogo(null)}
          onGuardada={() => {
            setDialogo(null)
            recargar()
          }}
          onEliminar={(lista) => {
            setDialogo(null)
            setErrorBorrado(null)
            setABorrar(lista)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(aBorrar)}
        onOpenChange={(abierto) => !abierto && setABorrar(null)}
        title={`¿Eliminar ${aBorrar?.title ?? 'la lista'}?`}
        description="Se borrará la lista y todos sus regalos, incluidos los que la familia ya haya marcado como comprados. No se puede deshacer."
        confirmLabel="Eliminar lista"
        onConfirm={eliminar}
        loading={borrando}
        error={errorBorrado}
      />
    </main>
  )
}
