-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('DISPONIBLE', 'COMPRADO');

-- CreateTable
CREATE TABLE "lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "access_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "price_cents" INTEGER,
    "comment" TEXT,
    "image_url" TEXT,
    "status" "product_status" NOT NULL DEFAULT 'DISPONIBLE',
    "purchased_by" TEXT,
    "purchased_at" TIMESTAMP(3),
    "viewer_id" TEXT,
    "viewing_from" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lists_slug_key" ON "lists"("slug");

-- CreateIndex
CREATE INDEX "products_list_id_idx" ON "products"("list_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
