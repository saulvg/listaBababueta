'use client'

import { Check, Copy, ExternalLink } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { AccessGate } from '@/components/access-gate'
import { BackLink } from '@/components/back-link'
import { Field } from '@/components/field'
import { Loader } from '@/components/loader'
import { Notice } from '@/components/notice'
import { ProductImage } from '@/components/product-image'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, esCodigo, mensajeDeError } from '@/lib/api/client'
import type { PublicProductResponse, PurchaseResponse } from '@/lib/api/types'
import { formatearPrecio } from '@/lib/format/price'
import { useApi } from '@/lib/hooks/use-api'
import { cn } from '@/lib/utils'
import { purchaseProductSchema } from '@/lib/validations/product'

/**
 * Dónde enviar el regalo, con botón de copiar.
 *
 * Se enseña entera y desde que se entra, no detrás de un desplegable ni solo
 * al marcar como comprado: quien llega aquí ya ha pasado la clave, y lo
 * normal es que esté a punto de pegar estas señas en una tienda. Lo escriben
 * los padres en texto libre (puede ser una dirección o un "escribidnos"), así
 * que se respetan sus saltos de línea y no se le da formato de nada.
 */
function DireccionDeEnvio({ direccion }: { direccion: string }) {
  const [copiada, setCopiada] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(direccion)
      setCopiada(true)
      window.setTimeout(() => setCopiada(false), 2000)
    } catch {
      // Sin portapapeles (navegador viejo, o servido sin https) no hay nada
      // que avisar: la dirección está a la vista y se puede seleccionar a
      // mano, que es justo lo que se hacía antes de que existiera el botón.
    }
  }

  return (
    <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Dónde enviarlo
      </p>
      <p className="whitespace-pre-line text-sm">{direccion}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void copiar()}
      >
        {copiada ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copiada ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  )
}

export function VistaRegalo({
  slug,
  productId,
}: {
  slug: string
  productId: string
}) {
  const { datos, error, cargando, recargar, fijarDatos } =
    useApi<PublicProductResponse>(
      `/api/public/products/${encodeURIComponent(productId)}`,
    )

  const [nombre, setNombre] = useState('')
  const [errorCampo, setErrorCampo] = useState<string | null>(null)
  const [errorCompra, setErrorCompra] = useState<string | null>(null)
  const [adelantado, setAdelantado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  /**
   * `anonima` no es lo mismo que "el nombre está vacío": es el botón de abajo,
   * que manda la compra sin nombre aunque haya algo escrito en el campo.
   */
  async function comprar(anonima: boolean) {
    if (!datos) return

    const validacion = purchaseProductSchema.safeParse({
      purchasedBy: anonima ? null : nombre,
    })

    if (!validacion.success) {
      setErrorCampo(validacion.error.issues[0]?.message ?? 'Revisa el nombre.')
      return
    }

    setErrorCampo(null)
    setErrorCompra(null)
    setAdelantado(false)
    setEnviando(true)

    try {
      const respuesta = await api.post<PurchaseResponse>(
        `/api/public/products/${encodeURIComponent(productId)}/purchase`,
        validacion.data,
      )

      // La respuesta ya trae el estado bueno; no hace falta volver a pedir el
      // regalo entero solo para repintar.
      fijarDatos({
        ...datos,
        product: { ...datos.product, ...respuesta.product },
      })
    } catch (fallo) {
      if (esCodigo(fallo, 'already_purchased')) {
        // El 409 es el caso que da sentido a toda la garantía del servidor
        // (CLAUDE.md §5) y se cuenta distinto del resto de errores: no ha
        // fallado nada, es que alguien ha llegado antes. Se recarga para
        // poder decir quién.
        setAdelantado(true)
        recargar()
      } else {
        setErrorCompra(mensajeDeError(fallo))
      }
    } finally {
      setEnviando(false)
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    void comprar(false)
  }

  if (esCodigo(error, 'list_locked')) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 sm:px-6">
        {/* Aquí el "volver" NO va a la lista: está bloqueada igual y saldría
            esta misma pantalla otra vez. */}
        <BackLink href="/listas">Todas las listas</BackLink>
        <AccessGate slug={slug} onUnlocked={recargar} />
      </main>
    )
  }

  const comprado = datos?.product.status === 'COMPRADO'

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 sm:px-6">
      <BackLink href={`/lista/${slug}`} className="mb-4">
        {datos ? datos.list.title : 'Volver a la lista'}
      </BackLink>

      {cargando && <Loader texto="Vamos a por ese regalo…" />}

      {error && !cargando ? <Notice>{mensajeDeError(error)}</Notice> : null}

      {datos && (
        <article className="space-y-4">
          <ProductImage
            src={datos.product.imageUrl}
            alt=""
            className="aspect-square w-full rounded-xl"
          />

          <div className="space-y-1">
            <h1 className="text-3xl">{datos.product.title}</h1>
            {datos.product.priceCents !== null && (
              <p className="text-muted-foreground">
                {formatearPrecio(datos.product.priceCents)}
              </p>
            )}
          </div>

          {datos.product.comment && (
            <p className="whitespace-pre-line">{datos.product.comment}</p>
          )}

          {/* Antes del botón de la tienda a propósito: es el dato que hace
              falta justo al comprar, no después. */}
          {datos.list.shippingAddress && (
            <DireccionDeEnvio direccion={datos.list.shippingAddress} />
          )}

          {datos.product.url && (
            <a
              href={datos.product.url}
              target="_blank"
              // noreferrer además de noopener: el enlace lo pega quien crea la
              // lista y no hay por qué contarle a la tienda de dónde viene.
              rel="noopener noreferrer"
              // Botón, pero de contorno: el relleno azul se lo queda "Marcar
              // como comprado", que es a lo que se viene a esta pantalla. Los
              // dos tienen el mismo tamaño; lo que los separa es el peso.
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'xl' }),
                'w-full border-primary-ink/40 text-primary-ink hover:bg-primary-ink/10 hover:text-primary-ink dark:hover:bg-primary-ink/10',
              )}
            >
              Ver producto
              <ExternalLink aria-hidden />
            </a>
          )}

          {adelantado && (
            <Notice tone="aviso">
              Alguien se te ha adelantado: este regalo ya está comprado.
            </Notice>
          )}

          {comprado ? (
            <Notice tone="hecho">
              {datos.product.purchasedBy
                ? `Ya lo ha comprado ${datos.product.purchasedBy}.`
                : 'Este regalo ya está comprado.'}
            </Notice>
          ) : (
            <form onSubmit={enviar} className="space-y-3 border-t pt-4">
              <Field
                label="Tu nombre (opcional)"
                error={errorCampo ?? undefined}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    placeholder="Tía Marta"
                    autoComplete="name"
                    maxLength={100}
                  />
                )}
              </Field>

              {errorCompra && <Notice>{errorCompra}</Notice>}

              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={enviando}
              >
                {enviando ? 'Marcando…' : 'Marcar como comprado'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={enviando}
                onClick={() => void comprar(true)}
              >
                Marcar de forma anónima
              </Button>
            </form>
          )}
        </article>
      )}
    </main>
  )
}
