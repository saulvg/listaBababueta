# Lista Bababueta

App para gestionar listas de regalos que los padres crean y mantienen, y que
comparten con la familia mediante un enlace con clave de acceso propia por
lista. Los familiares marcan los productos como comprados para que nadie
repita compra.

Las decisiones de diseño y el porqué de cada una están en
[CLAUDE.md](CLAUDE.md). Este fichero solo explica cómo levantar el proyecto.

## Requisitos

- **Node.js 24 LTS** (mínimo 22.12 — lo exige Prisma 7)
- **pnpm 9**
- Una base de datos Postgres en [Neon](https://neon.com)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env    # y rellenar los valores
pnpm db:migrate         # crea las tablas
pnpm dev                # http://localhost:3000
```

Las variables de entorno están documentadas una a una en
[.env.example](.env.example). Las dos que no son evidentes:

- `DATABASE_URL` es la cadena **con pooling** de Neon (el host lleva
  `-pooler`) y la usa la app en runtime.
- `DIRECT_URL` es la cadena **directa** y la usa Prisma para migrar, porque
  pgbouncer no admite las sentencias que necesita Migrate.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | TypeScript sin emitir |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Crea y aplica una migración |
| `pnpm db:generate` | Regenera el cliente de Prisma |
| `pnpm db:studio` | Explorador visual de la base de datos |

## Estructura

```
app/(public)/     Rutas públicas: landing y listas compartidas
app/(admin)/      Panel de los padres
app/api/          Route Handlers: toda la lógica de servidor
components/ui/    Componentes de shadcn/ui
lib/db.ts         Cliente de Prisma (singleton)
lib/validations/  Esquemas de Zod, uno por entidad
prisma/           Esquema y migraciones
```

El cliente de Prisma se genera en `lib/generated/` y no se versiona: se
regenera solo al instalar (`postinstall`).
