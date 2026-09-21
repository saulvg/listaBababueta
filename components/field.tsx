import type { ReactNode } from 'react'
import { useId } from 'react'

import { Label } from '@/components/ui/label'

type PropsDelControl = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

type FieldProps = {
  label: string
  /** Mensaje de error del campo, normalmente el `details` que devuelve el 422. */
  error?: string
  /** Texto de ayuda debajo de la etiqueta. */
  hint?: string
  className?: string
  children: (props: PropsDelControl) => ReactNode
}

/**
 * Etiqueta + control + error, con los ids y los `aria-` ya atados.
 *
 * El control se recibe como función y no como hijo suelto para poder pasarle
 * el id generado: si cada formulario los escribiera a mano, tarde o temprano
 * habría dos campos con el mismo id y la etiqueta enfocaría el que no es.
 */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId()
  const idError = `${id}-error`
  const idAyuda = `${id}-hint`

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>

      {hint && (
        <p id={idAyuda} className="mb-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? idError : hint ? idAyuda : undefined,
      })}

      {error && (
        <p id={idError} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
