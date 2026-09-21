'use client'

import { Trash2 } from 'lucide-react'
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
import { api, mensajeDeError } from '@/lib/api/client'
import type { AdminList, AdminListResponse } from '@/lib/api/types'
import { erroresDeApi, erroresDeZod, type ErroresDeCampo } from '@/lib/forms'
import { createListSchema, updateListSchema } from '@/lib/validations/list'

/**
 * Crear o editar una lista. Es el mismo formulario porque son los mismos dos
 * campos; lo único que cambia es a dónde va la petición.
 *
 * El estado inicial se toma de `lista` en el primer render, así que quien lo
 * use tiene que pasar un `key` distinto por lista (ver panel/page.tsx): es lo
 * que hace que al abrir otra lista el formulario se monte de cero en vez de
 * arrastrar lo anterior.
 */
export function DialogoLista({
  lista,
  open,
  onOpenChange,
  onGuardada,
  onEliminar,
}: {
  /** Sin lista, es un alta. */
  lista?: AdminList
  open: boolean
  onOpenChange: (abierto: boolean) => void
  onGuardada: () => void
  /** Pide al panel que abra la confirmación de borrado. */
  onEliminar?: (lista: AdminList) => void
}) {
  const editando = Boolean(lista)

  const [title, setTitle] = useState(lista?.title ?? '')
  const [accessKey, setAccessKey] = useState(lista?.accessKey ?? '')
  const [errores, setErrores] = useState<ErroresDeCampo>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()

    const esquema = editando ? updateListSchema : createListSchema
    const validacion = esquema.safeParse({ title, accessKey })

    if (!validacion.success) {
      setErrores(erroresDeZod(validacion.error))
      setError(null)
      return
    }

    setErrores({})
    setError(null)
    setEnviando(true)

    try {
      if (lista) {
        await api.patch<AdminListResponse>(
          `/api/admin/lists/${lista.id}`,
          validacion.data,
        )
      } else {
        await api.post<AdminListResponse>('/api/admin/lists', validacion.data)
      }

      onGuardada()
    } catch (fallo) {
      setError(mensajeDeError(fallo))
      setErrores(erroresDeApi(fallo))
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar lista' : 'Nueva lista'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <Field
            label="Título de la lista"
            error={errores.title}
            hint={
              // El slug se calcula al crear y luego no cambia, para no romper
              // los enlaces ya compartidos (CLAUDE.md §5). Conviene decirlo
              // aquí y no en un comentario que los padres no van a leer.
              editando
                ? 'El enlace de la lista no cambia aunque cambies el título.'
                : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                value={title}
                onChange={(evento) => setTitle(evento.target.value)}
                placeholder="Lista de Bababueta"
                autoFocus
              />
            )}
          </Field>

          <Field
            label="Clave de acceso"
            error={errores.accessKey}
            hint="La que compartiréis con la familia. Podéis volver a verla aquí cuando queráis."
          >
            {(props) => (
              <Input
                {...props}
                value={accessKey}
                onChange={(evento) => setAccessKey(evento.target.value)}
                placeholder="La que compartiréis con la familia"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            )}
          </Field>

          {error ? <Notice>{error}</Notice> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={enviando}>
              {enviando
                ? 'Guardando…'
                : editando
                  ? 'Guardar cambios'
                  : 'Crear lista'}
            </Button>
            <DialogClose render={<Button variant="outline" size="lg" />}>
              Cancelar
            </DialogClose>
          </div>
        </form>

        {lista && onEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(lista)}
            className="inline-flex items-center gap-1.5 self-start text-sm text-destructive hover:underline"
          >
            <Trash2 className="size-4" aria-hidden />
            Eliminar lista
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
