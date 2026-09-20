import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Por qué puede fracasar una compra. Se distinguen porque el frontend dice
 * cosas distintas: "alguien se te ha adelantado" no es lo mismo que "esta
 * lista ha cambiado".
 */
export type PurchaseFailure = "not_found" | "already_purchased";

export type PurchaseResult =
  | { ok: true; purchasedBy: string | null; purchasedAt: Date }
  | { ok: false; reason: PurchaseFailure };

export type PurchaseInput = {
  productId: string;
  /** Texto libre. Vacío o solo espacios significa compra anónima. */
  purchasedBy?: string | null;
};

/**
 * Marca un producto como comprado. Única garantía dura contra la doble
 * compra (CLAUDE.md §5).
 *
 * Recibe el cliente de Prisma por parámetro en lugar de importar el
 * singleton, para que los tests puedan apuntarlo a la rama de pruebas.
 */
export async function markProductAsPurchased(
  db: PrismaClient,
  { productId, purchasedBy }: PurchaseInput,
): Promise<PurchaseResult> {
  // Vacío o solo espacios significa compra anónima.
  const comprador = purchasedBy?.trim() || null;
  const purchasedAt = new Date();

  // Aquí está toda la garantía: el UPDATE lleva el estado en el WHERE, así
  // que Postgres solo escribe si el producto SIGUE disponible en el momento
  // de escribir. Si dos peticiones llegan a la vez, la segunda espera a que
  // la primera termine, vuelve a evaluar el WHERE, ya no encuentra fila y
  // devuelve count 0. No hace falta transacción: un UPDATE es atómico.
  const { count } = await db.product.updateMany({
    where: { id: productId, status: "DISPONIBLE" },
    data: { status: "COMPRADO", purchasedBy: comprador, purchasedAt },
  });

  if (count === 1) {
    return { ok: true, purchasedBy: comprador, purchasedAt };
  }

  // No se actualizó nada. Falta saber por qué, porque el frontend dice cosas
  // distintas: puede que el producto no exista o que alguien se adelantara.
  const producto = await db.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  return { ok: false, reason: producto ? "already_purchased" : "not_found" };
}
