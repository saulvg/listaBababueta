// Lo que devuelve cada endpoint, visto desde el navegador.
//
// No se reutilizan los tipos de Prisma a propósito: al pasar por JSON las
// fechas dejan de ser `Date` y se convierten en cadenas, así que un `List` de
// Prisma mentiría en el único sitio donde importa. Los nombres de los campos
// sí son los de la API, en inglés.

export type ProductStatus = 'DISPONIBLE' | 'COMPRADO'

/** Un regalo, tal y como lo ve la familia. */
export type Product = {
  id: string
  title: string
  url: string | null
  priceCents: number | null
  comment: string | null
  imageUrl: string | null
  status: ProductStatus
  purchasedBy: string | null
  purchasedAt: string | null
}

/** Una lista en el índice público: sin clave y sin productos. */
export type ListSummary = {
  id: string
  title: string
  slug: string
  createdAt: string
  productCount: number
  /** Si este navegador ya acertó la clave. Pinta el candado. */
  unlocked: boolean
}

/** La cabecera de una lista abierta. */
export type ListHeader = {
  id: string
  title: string
  slug: string
  /** Dónde enviar los regalos. Texto libre de los padres, o null si no han
   *  puesto nada. Solo viaja en respuestas que ya han pasado la clave. */
  shippingAddress: string | null
  createdAt: string
}

/** Una lista entera, como la ven los padres: con su clave, que es lo que van
 *  a compartir con la familia (por eso se guarda en texto plano). */
export type ListRecord = ListHeader & {
  accessKey: string
  /** Oculta a la familia: fuera de /listas y con 404 en su enlace directo.
   *  Cuelga de aquí y no de ListHeader a propósito — es un dato del panel, y
   *  a la familia no le llega en ninguna respuesta. */
  hidden: boolean
  updatedAt: string
}

/** En el índice del panel, además, los contadores de la cabecera. */
export type AdminList = ListRecord & {
  productCount: number
  purchasedCount: number
}

// --- Respuestas, endpoint a endpoint --------------------------------------

/** GET /api/public/lists */
export type ListsResponse = { lists: ListSummary[] }

/** GET /api/public/lists/[slug] */
export type PublicListResponse = { list: ListHeader; products: Product[] }

/** POST /api/public/lists/[slug]/access */
export type AccessResponse = { list: Omit<ListHeader, 'createdAt'> }

/** GET /api/public/products/[productId] */
export type PublicProductResponse = {
  product: Product
  list: Omit<ListHeader, 'createdAt'>
}

/** POST /api/public/products/[productId]/purchase */
export type PurchaseResponse = {
  product: Pick<Product, 'id' | 'status' | 'purchasedBy' | 'purchasedAt'>
}

/** GET /api/auth/session */
export type SessionResponse = {
  parent: { email: string } | null
  unlockedListIds: string[]
}

/** GET /api/admin/lists — el índice del panel, con contadores. */
export type AdminListsResponse = { lists: AdminList[] }

/** POST y PATCH de /api/admin/lists — la lista recién creada o cambiada, sin
 *  contadores: ahí todavía no hay nada que contar. */
export type AdminListResponse = { list: ListRecord }

/** GET /api/admin/lists/[listId] — la lista con sus regalos. */
export type AdminListDetailResponse = {
  list: ListRecord & { products: Product[] }
}

/** POST y PATCH de productos. */
export type ProductResponse = { product: Product }
