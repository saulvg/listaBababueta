import { PrismaNeon } from '@prisma/adapter-neon'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { PrismaClient } from '@/lib/generated/prisma/client'
import {
  markProductAsPurchased,
  unmarkProductAsPurchased,
} from '@/lib/products/purchase'

// Estos tests hablan con una base de datos Postgres de verdad (la rama `test`
// de Neon). No se simula: un mock no puede demostrar atomicidad, que es
// exactamente lo que está en juego aquí.
const connectionString = process.env.TEST_DATABASE_URL

if (!connectionString) {
  throw new Error(
    'Falta TEST_DATABASE_URL. Crea una rama `test` en Neon y añade su cadena ' +
      'de conexión directa a .env.local. Ver .env.example.',
  )
}

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

let listId: string

beforeAll(async () => {
  const list = await db.list.create({
    data: {
      title: 'Lista de pruebas',
      slug: `test-${Date.now()}`,
      accessKey: 'clave-de-prueba',
    },
  })
  listId = list.id
})

afterEach(async () => {
  await db.product.deleteMany({ where: { listId } })
})

afterAll(async () => {
  await db.list.delete({ where: { id: listId } })
  await db.$disconnect()
})

async function crearProductoDisponible(overrides = {}) {
  return db.product.create({
    data: { listId, title: 'Un regalo', ...overrides },
  })
}

describe('markProductAsPurchased', () => {
  it('marca un producto disponible como comprado', async () => {
    const producto = await crearProductoDisponible()

    const resultado = await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'La tía Carmen',
    })

    expect(resultado.ok).toBe(true)

    const enBd = await db.product.findUniqueOrThrow({
      where: { id: producto.id },
    })
    expect(enBd.status).toBe('COMPRADO')
    expect(enBd.purchasedBy).toBe('La tía Carmen')
    expect(enBd.purchasedAt).toBeInstanceOf(Date)
  })

  it('ante peticiones simultáneas, solo una gana', async () => {
    const producto = await crearProductoDisponible()
    const compradores = ['Carmen', 'Luis', 'Marta', 'Pedro', 'Ana']

    const resultados = await Promise.all(
      compradores.map((nombre) =>
        markProductAsPurchased(db, {
          productId: producto.id,
          purchasedBy: nombre,
        }),
      ),
    )

    const ganadores = resultados.filter((r) => r.ok)
    const perdedores = resultados.filter((r) => !r.ok)

    expect(ganadores).toHaveLength(1)
    expect(perdedores).toHaveLength(compradores.length - 1)
    for (const perdedor of perdedores) {
      expect(perdedor).toMatchObject({ reason: 'already_purchased' })
    }
  })

  it('el comprador guardado es el de la petición que ganó', async () => {
    const producto = await crearProductoDisponible()
    const compradores = ['Carmen', 'Luis', 'Marta']

    const resultados = await Promise.all(
      compradores.map((nombre) =>
        markProductAsPurchased(db, {
          productId: producto.id,
          purchasedBy: nombre,
        }),
      ),
    )

    const ganador = resultados.find((r) => r.ok)
    expect(ganador).toBeDefined()

    const enBd = await db.product.findUniqueOrThrow({
      where: { id: producto.id },
    })
    expect(enBd.purchasedBy).toBe(ganador!.ok ? ganador!.purchasedBy : null)
    expect(compradores).toContain(enBd.purchasedBy)
  })

  it('un producto ya comprado no se puede volver a comprar', async () => {
    const producto = await crearProductoDisponible()

    const primera = await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Carmen',
    })
    const segunda = await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Luis',
    })

    expect(primera.ok).toBe(true)
    expect(segunda).toMatchObject({ ok: false, reason: 'already_purchased' })

    const enBd = await db.product.findUniqueOrThrow({
      where: { id: producto.id },
    })
    expect(enBd.purchasedBy).toBe('Carmen')
  })

  it('guarda null cuando el comprador se deja en blanco', async () => {
    const producto = await crearProductoDisponible()

    await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: '   ',
    })

    const enBd = await db.product.findUniqueOrThrow({
      where: { id: producto.id },
    })
    expect(enBd.status).toBe('COMPRADO')
    expect(enBd.purchasedBy).toBeNull()
  })

  it('el soft lock de otra sesión no impide comprar', async () => {
    const producto = await crearProductoDisponible({
      viewerId: 'otra-sesion',
      viewingFrom: new Date(),
    })

    const resultado = await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Carmen',
    })

    expect(resultado.ok).toBe(true)
  })

  it('distingue un producto inexistente de uno ya comprado', async () => {
    const resultado = await markProductAsPurchased(db, {
      productId: 'no-existe',
      purchasedBy: 'Carmen',
    })

    expect(resultado).toMatchObject({ ok: false, reason: 'not_found' })
  })
})

// Desmarcar es la otra mitad de la misma garantía: si escribiera el estado
// sin condición, un desmarcado a destiempo podría borrar una compra recién
// hecha y dejar dos personas convencidas de que el regalo es suyo.
describe('unmarkProductAsPurchased', () => {
  it('devuelve un regalo comprado a disponible y lo deja comprable', async () => {
    const producto = await crearProductoDisponible()
    await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Carmen',
    })

    const resultado = await unmarkProductAsPurchased(db, {
      productId: producto.id,
    })

    expect(resultado.ok).toBe(true)

    const enBd = await db.product.findUniqueOrThrow({
      where: { id: producto.id },
    })
    expect(enBd.status).toBe('DISPONIBLE')
    // No basta con el estado: si quedara el nombre, la lista seguiría
    // diciendo "comprado por Carmen" al lado de un regalo disponible.
    expect(enBd.purchasedBy).toBeNull()
    expect(enBd.purchasedAt).toBeNull()

    const segundaCompra = await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Luis',
    })
    expect(segundaCompra.ok).toBe(true)
  })

  it('ante desmarcados simultáneos, solo uno gana', async () => {
    const producto = await crearProductoDisponible()
    await markProductAsPurchased(db, {
      productId: producto.id,
      purchasedBy: 'Carmen',
    })

    const resultados = await Promise.all(
      [1, 2, 3].map(() =>
        unmarkProductAsPurchased(db, { productId: producto.id }),
      ),
    )

    expect(resultados.filter((r) => r.ok)).toHaveLength(1)
    for (const perdedor of resultados.filter((r) => !r.ok)) {
      expect(perdedor).toMatchObject({ reason: 'not_purchased' })
    }
  })

  it('distingue un producto inexistente de uno que no estaba comprado', async () => {
    const disponible = await crearProductoDisponible()

    expect(
      await unmarkProductAsPurchased(db, { productId: disponible.id }),
    ).toMatchObject({ ok: false, reason: 'not_purchased' })

    expect(
      await unmarkProductAsPurchased(db, { productId: 'no-existe' }),
    ).toMatchObject({ ok: false, reason: 'not_found' })
  })
})
