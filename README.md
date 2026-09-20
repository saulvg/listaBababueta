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
cp .env.example .env.local   # y rellenar los valores
pnpm db:migrate              # crea las tablas
pnpm dev                     # http://localhost:3000
```

Las variables de entorno están documentadas una a una en
[.env.example](.env.example). Las dos que no son evidentes:

- `DATABASE_URL` es la cadena **con pooling** de Neon (el host lleva
  `-pooler`) y la usa la app en runtime.
- `DIRECT_URL` es la cadena **directa** y la usa Prisma para migrar, porque
  pgbouncer no admite las sentencias que necesita Migrate.

## Scripts

| Comando                | Qué hace                                      |
| ---------------------- | --------------------------------------------- |
| `pnpm dev`             | Servidor de desarrollo                        |
| `pnpm build`           | Build de producción                           |
| `pnpm typecheck`       | TypeScript sin emitir                         |
| `pnpm lint`            | ESLint                                        |
| `pnpm test`            | Tests (necesitan `TEST_DATABASE_URL`)         |
| `pnpm db:migrate`      | Crea y aplica una migración                   |
| `pnpm db:migrate:test` | Aplica las migraciones a la rama `test`       |
| `pnpm db:generate`     | Regenera el cliente de Prisma                 |
| `pnpm db:studio`       | Explorador visual de la base de datos         |
| `pnpm hash:password`   | Genera el hash bcrypt de una cuenta de padres |

## Cuentas de los padres

No hay registro ni tabla de usuarios: las dos cuentas son fijas y viven en el
entorno. Para cada una:

```bash
pnpm hash:password    # pide la contraseña y da la línea a pegar
```

**Cuidado con los `$` del hash en `.env.local`.** El cargador de `.env` de
Next 16 interpreta `$LO_QUE_SEA` como una variable y se come media cadena, y
lo hace igual con comillas simples que dobles. En `.env.local` los dólares van
escapados (`\$2b\$10\$...`); en Vercel, donde la variable no pasa por ese
cargador, el hash va tal cual. `pnpm hash:password` imprime las dos formas.

Si el hash llega mal, el login responde "email o contraseña incorrectos" para
siempre; por eso la app comprueba la forma del hash al arrancar el login y
escribe en consola qué ha pasado.

## La API

Todavía no hay interfaz: la capa de servidor se prueba con `curl`. La frontera
de seguridad está en la URL — todo lo que cuelga de `/api/public/` es para la
familia, y el resto exige sesión de padres.

| Ruta                                        | Métodos            | Quién                          |
| ------------------------------------------- | ------------------ | ------------------------------ |
| `/api/auth/login`                           | POST               | Público (con rate limiting)    |
| `/api/auth/logout`                          | POST               | —                              |
| `/api/auth/session`                         | GET                | Devuelve quién eres            |
| `/api/admin/lists`                          | GET, POST          | Padres                         |
| `/api/admin/lists/[listId]`                 | GET, PATCH, DELETE | Padres                         |
| `/api/admin/lists/[listId]/products`        | GET, POST          | Padres                         |
| `/api/admin/products/[productId]`           | PATCH, DELETE      | Padres                         |
| `/api/public/lists`                         | GET                | Cualquiera (solo títulos)      |
| `/api/public/lists/[slug]/access`           | POST               | Cualquiera (con rate limiting) |
| `/api/public/lists/[slug]`                  | GET                | Quien haya acertado la clave   |
| `/api/public/products/[productId]/purchase` | POST               | Quien haya acertado la clave   |

Los errores siempre vienen en el mismo sobre, con un `code` para el código y
un `message` para la persona:

```json
{
  "error": {
    "code": "already_purchased",
    "message": "Alguien se te ha adelantado..."
  }
}
```

## Tests

Corren contra una base de datos Postgres real: la rama `test` de Neon, cuya
cadena directa va en `TEST_DATABASE_URL`. No se simula la base de datos
porque lo que se prueba es la atomicidad de la compra, y eso un mock no puede
demostrarlo. Los tests crean y borran sus propias filas, así que esa variable
nunca debe apuntar a la base real.

```bash
pnpm db:migrate:test   # solo la primera vez, o tras cambiar el esquema
pnpm test
```

## Estructura

```
app/(public)/     Rutas públicas: landing y listas compartidas
app/(admin)/      Panel de los padres
app/api/admin/    Route Handlers que exigen sesión de padres
app/api/public/   Route Handlers para la familia
components/ui/    Componentes de shadcn/ui
lib/api/          Sobre de respuesta y envoltorio de los handlers
lib/auth/         Cuentas de los padres y sesiones (iron-session)
lib/db.ts         Cliente de Prisma (singleton)
lib/email/        Aviso por Resend al comprar un regalo
lib/products/     Compra de un producto (garantía anti-doble-compra)
lib/rate-limit.ts Contador en memoria para login y claves de lista
lib/validations/  Esquemas de Zod, uno por entidad
prisma/           Esquema y migraciones
```

El cliente de Prisma se genera en `lib/generated/` y no se versiona: se
regenera solo al instalar (`postinstall`).
