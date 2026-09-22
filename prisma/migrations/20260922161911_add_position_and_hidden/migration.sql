-- Orden manual de listas y regalos, y listas ocultas a la familia.
--
-- Las columnas entran con DEFAULT, así que ninguna fila existente se queda a
-- medias mientras corre esto. Pero un DEFAULT 0 en todas las filas sería un
-- empate general: al ordenar por `position` el orden saldría arbitrario y las
-- listas de la familia bailarían solas en el primer despliegue. Por eso las
-- dos UPDATE de abajo: rellenan la posición con el orden que se está viendo
-- HOY, para que después de migrar no se mueva nada de sitio.

-- AlterTable
ALTER TABLE "lists" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- Relleno: las listas se venían enseñando de la más nueva a la más vieja
-- (orderBy createdAt desc), así que la más reciente se queda en la posición 0.
UPDATE "lists" AS l
SET "position" = orden.fila
FROM (
    SELECT "id", (ROW_NUMBER() OVER (ORDER BY "created_at" DESC, "id" ASC) - 1)::int AS fila
    FROM "lists"
) AS orden
WHERE l."id" = orden."id";

-- Relleno: los regalos iban al revés, de la más vieja a la más nueva
-- (orderBy createdAt asc), y cada lista numera los suyos desde cero.
UPDATE "products" AS p
SET "position" = orden.fila
FROM (
    SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "list_id" ORDER BY "created_at" ASC, "id" ASC) - 1)::int AS fila
    FROM "products"
) AS orden
WHERE p."id" = orden."id";

-- DropIndex
DROP INDEX "products_list_id_idx";

-- CreateIndex
CREATE INDEX "products_list_id_position_idx" ON "products"("list_id", "position");
