import { ApiError, jsonOk } from '@/lib/api/responses'
import { parseBody, route } from '@/lib/api/route'
import { requireParent } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { REGISTRO_NO_ENCONTRADO, esErrorPrisma } from '@/lib/db-errors'
import { updateProductSchema } from '@/lib/validations/product'

// /api/admin/products/[productId] — editar y borrar un producto. Solo padres.
//
// Ojo a lo que NO se puede tocar aquí: `status`, `purchasedBy` y
// `purchasedAt`. El paso a COMPRADO tiene su propio endpoint porque es la
// única operación con concurrencia real del proyecto (CLAUDE.md §5) y pasa
// por markProductAsPurchased(). Dejar que un PATCH genérico escribiera el
// estado sería una puerta trasera a esa garantía; el esquema de Zod ni
// siquiera acepta esos campos.

type Contexto = { params: Promise<{ productId: string }> }

const NO_EXISTE = new ApiError(
  404,
  'product_not_found',
  'Ese regalo no existe.',
)

export const PATCH = route<Contexto>(async (request, { params }) => {
  await requireParent()
  const { productId } = await params

  const datos = await parseBody(request, updateProductSchema)

  try {
    const producto = await prisma.product.update({
      where: { id: productId },
      data: datos,
    })
    return jsonOk({ product: producto })
  } catch (error) {
    if (esErrorPrisma(error, REGISTRO_NO_ENCONTRADO)) throw NO_EXISTE
    throw error
  }
})

export const DELETE = route<Contexto>(async (_request, { params }) => {
  await requireParent()
  const { productId } = await params

  try {
    await prisma.product.delete({ where: { id: productId } })
    return jsonOk({ ok: true })
  } catch (error) {
    if (esErrorPrisma(error, REGISTRO_NO_ENCONTRADO)) throw NO_EXISTE
    throw error
  }
})
