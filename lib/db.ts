import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/lib/generated/prisma/client";

// Cliente de Prisma como singleton (CLAUDE.md §4).
//
// En desarrollo, el hot reload de Next.js reevalúa los módulos en cada
// cambio. Sin este singleton se abriría una conexión nueva por recarga
// hasta agotar el pool de Neon. En producción el módulo se evalúa una vez.
//
// Prisma 7 no lee la URL del schema: la conexión de runtime entra por el
// driver adapter. Aquí se usa DATABASE_URL, la cadena CON pooling.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Ver .env.example.",
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
