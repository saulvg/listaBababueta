'use client'

import { Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Field } from '@/components/field'
import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api, mensajeDeError } from '@/lib/api/client'
import type { Product, ProductResponse } from '@/lib/api/types'
import { centimosAEuros, parsearEuros } from '@/lib/format/price'
import { erroresDeApi, erroresDeZod, type ErroresDeCampo } from '@/lib/forms'
import {
  createProductSchema,
  purchaseProductSchema,
  updateProductSchema,
} from '@/lib/validations/product'

/**
 * Alta y edición de un regalo.
 *
 * Lo que NO está aquí: el estado de comprado. Un PATCH que escribiera
 * `status` sería una puerta trasera a la garantía anti-doble-compra, y por eso
 * el esquema de Zod del servidor ni siquiera acepta ese campo (CLAUDE.md §5).
 *
 * Igual que el diálogo de lista, toma los valores iniciales en el primer
 * render: quien lo use pasa un `key` por producto.
 */
export function DialogoProducto({
  listId,
  producto,
  open,
  onOpenChange,
  onGuardado,
  onEliminar,
}: {
  listId: string
  /** Sin producto, es un alta. */
  producto?: Product
  open: boolean
  onOpenChange: (abierto: boolean) => void
  onGuardado: () => void
  onEliminar?: (producto: Product) => void
}) {
  const editando = Boolean(producto)

  const [title, setTitle] = useState(producto?.title ?? '')
  const [url, setUrl] = useState(producto?.url ?? '')
  // El precio vive en el formulario como euros tecleados; a céntimos se pasa
  // al enviar (CLAUDE.md §3).
  const [precio, setPrecio] = useState(centimosAEuros(producto?.priceCents))
  const [imageUrl, setImageUrl] = useState(producto?.imageUrl ?? '')
  const [comment, setComment] = useState(producto?.comment ?? '')

  const [errores, setErrores] = useState<ErroresDeCampo>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Lo de marcar y desmarcar va por su cuenta: otro endpoint, otro error que
  // enseñar y otro botón que deshabilitar mientras tanto.
  const [comprador, setComprador] = useState(producto?.purchasedBy ?? '')
  const [errorEstado, setErrorEstado] = useState<string | null>(null)
  const [cambiando, setCambiando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()

    const euros = parsearEuros(precio)

    if (!euros.ok) {
      setErrores({ priceCents: euros.error })
      setError(null)
      return
    }

    const esquema = editando ? updateProductSchema : createProductSchema
    const validacion = esquema.safeParse({
      title,
      url,
      imageUrl,
      comment,
      priceCents: euros.centimos,
    })

    if (!validacion.success) {
      setErrores(erroresDeZod(validacion.error))
      setError(null)
      return
    }

    setErrores({})
    setError(null)
    setEnviando(true)

    try {
      if (producto) {
        await api.patch<ProductResponse>(
          `/api/admin/products/${producto.id}`,
          validacion.data,
        )
      } else {
        await api.post<ProductResponse>(
          `/api/admin/lists/${listId}/products`,
          validacion.data,
        )
      }

      onGuardado()
    } catch (fallo) {
      setError(mensajeDeError(fallo))
      setErrores(erroresDeApi(fallo))
      setEnviando(false)
    }
  }

  /**
   * Marca o desmarca, según cómo esté ahora. Los padres marcan cuando lo han
   * comprado ellos o cuando alguien se lo ha dicho por teléfono; desmarcan
   * cuando se marcó por error, que es para lo que no había forma hasta ahora.
   */
  async function cambiarEstado(evento: FormEvent) {
    evento.preventDefault()
    if (!producto) return

    setErrorEstado(null)
    setCambiando(true)

    try {
      if (producto.status === 'COMPRADO') {
        await api.delete(`/api/admin/products/${producto.id}/purchase`)
      } else {
        const validacion = purchaseProductSchema.safeParse({
          purchasedBy: comprador,
        })

        if (!validacion.success) {
          setErrorEstado(
            validacion.error.issues[0]?.message ?? 'Revisa el nombre.',
          )
          setCambiando(false)
          return
        }

        await api.post(
          `/api/admin/products/${producto.id}/purchase`,
          validacion.data,
        )
      }

      onGuardado()
    } catch (fallo) {
      // El 409 llega cuando un familiar se ha adelantado (o se ha adelantado
      // el otro padre) mientras este diálogo estaba abierto.
      setErrorEstado(mensajeDeError(fallo))
      setCambiando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar producto' : 'Añadir producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <Field label="Título" error={errores.title}>
            {(props) => (
              <Input
                {...props}
                value={title}
                onChange={(evento) => setTitle(evento.target.value)}
                placeholder="Carrito de paseo"
                autoFocus
              />
            )}
          </Field>

          <Field label="Enlace del producto" error={errores.url}>
            {(props) => (
              <Input
                {...props}
                type="url"
                inputMode="url"
                value={url}
                onChange={(evento) => setUrl(evento.target.value)}
                placeholder="https://..."
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio estimado" error={errores.priceCents}>
              {(props) => (
                <Input
                  {...props}
                  // `decimal` y no `numeric`: en el móvil saca el teclado con
                  // coma, que es como se escriben aquí los céntimos.
                  inputMode="decimal"
                  value={precio}
                  onChange={(evento) => setPrecio(evento.target.value)}
                  placeholder="320"
                />
              )}
            </Field>

            <Field label="Imagen (URL)" error={errores.imageUrl}>
              {(props) => (
                <Input
                  {...props}
                  type="url"
                  inputMode="url"
                  value={imageUrl}
                  onChange={(evento) => setImageUrl(evento.target.value)}
                  placeholder="https://..."
                />
              )}
            </Field>
          </div>

          <Field label="Comentario" error={errores.comment}>
            {(props) => (
              <Textarea
                {...props}
                value={comment}
                onChange={(evento) => setComment(evento.target.value)}
                placeholder="Por qué os gusta, alguna preferencia de color..."
                rows={3}
              />
            )}
          </Field>

          {error ? <Notice>{error}</Notice> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </Button>
            <DialogClose render={<Button variant="outline" size="lg" />}>
              Cancelar
            </DialogClose>
          </div>
        </form>

        {/* El estado de compra va en su propio formulario, fuera del de
            arriba: son dos peticiones distintas a dos endpoints distintos, y
            anidar formularios no es HTML válido. */}
        {producto && (
          <form
            onSubmit={cambiarEstado}
            className="space-y-3 rounded-xl border p-3"
          >
            {producto.status === 'COMPRADO' ? (
              <>
                <p className="text-sm">
                  <Check
                    className="mr-1 inline size-4 align-text-bottom text-success"
                    aria-hidden
                  />
                  {producto.purchasedBy
                    ? `Comprado por ${producto.purchasedBy}`
                    : 'Comprado de forma anónima'}
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={cambiando}
                >
                  {cambiando ? 'Desmarcando…' : 'Desmarcar como comprado'}
                </Button>
              </>
            ) : (
              <>
                <Field label="Marcarlo como comprado a nombre de (opcional)">
                  {(props) => (
                    <Input
                      {...props}
                      value={comprador}
                      onChange={(evento) => setComprador(evento.target.value)}
                      placeholder="Tía Marta"
                      maxLength={100}
                    />
                  )}
                </Field>
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={cambiando}
                >
                  {cambiando ? 'Marcando…' : 'Marcar como comprado'}
                </Button>
              </>
            )}

            {errorEstado ? <Notice>{errorEstado}</Notice> : null}
          </form>
        )}

        {producto && onEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(producto)}
            className="inline-flex items-center gap-1.5 self-start text-sm text-destructive hover:underline"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar producto
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
