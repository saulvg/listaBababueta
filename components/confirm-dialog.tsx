'use client'

import { Notice } from '@/components/notice'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Confirmación de algo que no tiene vuelta atrás: borrar una lista (y con
 * ella todos sus regalos, que caen por la clave ajena) o borrar un regalo.
 *
 * El botón peligroso no es el que tiene el foco al abrir ni el que está donde
 * el ratón ya estaba: primero "Cancelar".
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  loading = false,
  error,
}: {
  open: boolean
  onOpenChange: (abierto: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-1">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error ? <Notice>{error}</Notice> : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose render={<Button variant="outline" size="lg" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando…' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
