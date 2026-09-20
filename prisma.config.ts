import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js lee .env.local para los secretos de desarrollo, pero Prisma no sabe
// nada de esa convención: sin esto buscaría solo .env. El primer fichero que
// define una variable gana, y las del entorno real (Vercel) tienen prioridad
// sobre ambos, así que en producción esto no hace nada.
config({ path: [".env.local", ".env"] });

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
