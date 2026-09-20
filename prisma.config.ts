import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Configuración del CLI de Prisma (migraciones, introspección, seed).
// Desde Prisma 7 las URLs de conexión viven aquí y no en schema.prisma.
//
// Ojo: la conexión de MIGRACIÓN debe ser la directa de Neon, sin pooling.
// pgbouncer no soporta las sentencias que Migrate necesita. La conexión
// con pooling (DATABASE_URL) la usa la app en runtime, en lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
