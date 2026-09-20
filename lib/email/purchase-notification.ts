import { emailsDePadres } from '@/lib/auth/parents'
import { escaparHtml, getResend, remitente } from '@/lib/email/resend'

// Aviso a los padres cuando un familiar marca un regalo como comprado.
//
// Regla de oro de este módulo: NUNCA lanza. Que Resend esté caído no puede
// convertir una compra que ya está guardada en la base de datos en un error
// para quien la hizo. Lo peor que puede pasar aquí es un console.error.

export type PurchaseNotification = {
  listTitle: string
  listSlug: string
  productTitle: string
  /** Texto libre; `null` significa compra anónima. */
  purchasedBy: string | null
}

function urlDeLaLista(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3000'
  return `${base.replace(/\/+$/, '')}/lista/${slug}`
}

export async function enviarAvisoDeCompra({
  listTitle,
  listSlug,
  productTitle,
  purchasedBy,
}: PurchaseNotification): Promise<void> {
  const resend = getResend()
  const from = remitente()
  const destinatarios = emailsDePadres()

  if (!resend || !from || destinatarios.length === 0) {
    // getResend() y remitente() ya avisan del porqué; aquí solo falta el caso
    // de que no haya ninguna cuenta de padres configurada.
    if (destinatarios.length === 0) {
      console.warn(
        '[email] No hay cuentas de padres: no se avisa de la compra.',
      )
    }
    return
  }

  const quien = purchasedBy ?? 'Alguien (compra anónima)'
  const enlace = urlDeLaLista(listSlug)

  try {
    const { error } = await resend.emails.send({
      from,
      to: destinatarios,
      subject: `🎁 Regalo comprado: ${productTitle}`,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.6;">
          <p><strong>${escaparHtml(quien)}</strong> ha marcado como comprado:</p>
          <p style="font-size: 1.2em; margin: 1em 0;">
            🎁 <strong>${escaparHtml(productTitle)}</strong>
          </p>
          <p>De la lista <strong>${escaparHtml(listTitle)}</strong>.</p>
          <p><a href="${escaparHtml(enlace)}">Ver la lista</a></p>
        </div>
      `,
      text:
        `${quien} ha marcado como comprado: ${productTitle}\n` +
        `Lista: ${listTitle}\n${enlace}\n`,
    })

    // Resend devuelve el fallo en el resultado en vez de lanzarlo, así que
    // sin mirar `error` un envío rechazado pasaría por bueno.
    if (error) {
      console.error('[email] Resend rechazó el aviso de compra:', error)
    }
  } catch (fallo) {
    console.error('[email] No se pudo enviar el aviso de compra:', fallo)
  }
}
