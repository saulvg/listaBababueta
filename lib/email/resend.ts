import { Resend } from 'resend'

// Cliente de Resend perezoso. La clave se mira al enviar, no al importar: así
// `pnpm dev` y `pnpm build` funcionan sin RESEND_API_KEY y lo único que pasa
// es que los avisos no salen (con su aviso en consola).

let cliente: Resend | null | undefined

export function getResend(): Resend | null {
  if (cliente !== undefined) return cliente

  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    console.warn(
      '[email] Falta RESEND_API_KEY: no se enviarán avisos por email.',
    )
    cliente = null
    return cliente
  }

  cliente = new Resend(apiKey)
  return cliente
}

export function remitente(): string | null {
  const from = process.env.EMAIL_FROM?.trim()

  if (!from) {
    console.warn('[email] Falta EMAIL_FROM: no se enviarán avisos por email.')
    return null
  }

  return from
}

/**
 * Escapa el texto que escriben las personas antes de meterlo en el HTML del
 * correo. El título de un regalo y el nombre de quien compra son texto libre,
 * y sin esto un `<` cualquiera rompería el mensaje.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
