'use client'

import { Check, Link2, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import { api, esCodigo, mensajeDeError } from '@/lib/api/client'
import type { AdminList, AdminListsResponse } from '@/lib/api/types'
import { useApi } from '@/lib/hooks/use-api'

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

      {datos && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datos.lists.map((lista) => (
            <li key={lista.id}>
              <div className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/panel/${lista.id}`}
                    className="font-heading text-xl hover:underline"
                  >
                    {lista.title}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${lista.title}`}
                    onClick={() => setDialogo({ modo: 'editar', lista })}
                  >
                    <Pencil aria-hidden />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {resumen(lista)}
                </p>

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
              {datos.lists.length === 0
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
