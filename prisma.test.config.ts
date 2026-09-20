import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: [".env.local", ".env"] });

// Misma configuración que prisma.config.ts pero apuntando a la rama `test` de
// Neon. Existe como fichero aparte, y no como variable de entorno puesta a
// mano delante del comando, para que aplicar las migraciones a la base de
// pruebas sea un comando idéntico en cualquier terminal y no se pueda
// confundir con la base real por un despiste.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("TEST_DATABASE_URL"),
  },
});
