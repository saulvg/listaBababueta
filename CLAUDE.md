1. Qué es esto

App para gestionar listas de regalos (varias listas, no solo una) que los padres crean y mantienen, y que comparten con familiares mediante un enlace con clave de acceso propia por lista. Los familiares pueden marcar productos como comprados para evitar duplicados.

2. Stack
   Next.js (App Router, TypeScript) — frontend y backend en el mismo proyecto.
   Tailwind CSS + shadcn/ui — componentes copiados al proyecto, no dependencia pesada.
   Prisma + Postgres (Neon) — ORM y base de datos gestionada.
   iron-session — sesión de los padres mediante cookie firmada. NO NextAuth (pensado para multi-proveedor, aquí sobra).
   bcrypt — hash de la contraseña de los padres.
   Zod — validación de todos los formularios (creación de lista, productos, login).
   Resend — email a los padres cuando se marca un producto como comprado.
   Vercel — despliegue. Un único entorno de producción por ahora.

Deliberadamente fuera: NextAuth, websockets, Redis, cola de mensajes, entorno de pre. Ver sección 8 (trampas) para el porqué de cada exclusión.

3. Modelo de datos (resumen)
   Cuenta familiar — no es una tabla de usuarios. Es una única cuenta (email + hash de contraseña) definida en variables de entorno. No hay registro abierto.
   lists: id, título, access_key (texto plano, definida y editable por los padres, único requisito: no vacía), fecha de creación.
   products: id, list_id (FK a lists), título, enlace, precio estimado, comentario, imagen (URL, sin subida de ficheros), estado (disponible / comprado), comprado_por (texto libre, nullable — anónimo si se deja vacío).
   Soft lock de visualización: columna(s) en products o tabla aparte — quién lo está viendo ahora mismo (id de sesión) y desde cuándo, con expiración corta (3–5 min). Es solo UX, no la garantía real de no-doble-compra (ver sección 5).
4. Convenciones de carpetas y estilo
   App Router de Next.js: rutas públicas bajo un grupo (public), panel de administración de los padres bajo (admin).
   Lógica de servidor en app/api/\* como Route Handlers, no Server Actions sueltas repartidas por los componentes — mantiene la lógica de negocio centralizada y fácil de testear.
   Esquemas de validación Zod en lib/validations/, uno por entidad (list.ts, product.ts, auth.ts).
   Cliente de Prisma como singleton en lib/db.ts (patrón estándar de Next.js para evitar múltiples conexiones en desarrollo).

   ### Convención de commits

   Los commits los ejecuta siempre la persona, nunca el agente (bloqueado
   además por permisos en `.claude/settings.json`). Ver skill
   `proposing-commits` para el criterio de cuándo avisar y cómo proponer
   el mensaje.

5. Decisiones de arquitectura (el porqué, no solo el qué)
   Anti-doble-compra real: una transacción que actualiza el estado del producto SOLO SI sigue en disponible. Si la transacción no afecta ninguna fila, el servidor responde con error y el frontend avisa de que ya fue comprado. Esta es la única garantía dura.
   "Alguien lo está mirando": aviso cosmético mediante polling (cada pocos segundos), no websockets. Es solo UX; la garantía real vive en el punto anterior.
   Autenticación de los padres: iron-session + bcrypt, sin tabla de usuarios. Cuentas fijas en variables de entorno.
   Clave de acceso por lista: en texto plano en la base de datos, porque los padres necesitan poder volver a verla para compartirla o recordarla — hashear algo que hay que volver a mostrar no tiene sentido. Validación mínima: no vacía.
   Múltiples listas: lists es una tabla propia con access_key individual; cada lista tiene su propia URL (/lista/<slug>) y su propia sesión de acceso (entrar a una lista no da acceso a las demás).
6. Seguridad
   Contraseña de la cuenta familiar: hash bcrypt guardado en variable de entorno, nunca texto plano.
   Clave de acceso de cada lista: texto plano en base de datos (justificado arriba), pero protegida con rate limiting por IP/sesión en el endpoint de acceso, porque la elige un humano y puede ser corta.
   Rate limiting también en el login de los padres.
   Todas las entradas de formulario pasan por Zod antes de tocar la base de datos.
   Variables sensibles (hash de contraseña, cadena de conexión a la base de datos, API key de Resend) solo en .env, nunca commiteadas. Ver .env.example para la lista de variables esperadas, sin valores reales.
7. Cómo se lanzan los tests

Aún no hay runner configurado — se añade cuando se escriba el primer test. El primer test a escribir, antes de programar la lógica, es el de la transacción de anti-doble-compra (sección 5): es la única pieza de este proyecto con caso límite de concurrencia real, y por tanto la única que justifica criterios de aceptación definidos por adelantado según la metodología. El resto de tareas van con señal mínima (compila, type-checker en verde, prueba manual).

8. Trampas conocidas / decisiones que no hay que revisar sin motivo
   No montar NextAuth. Dos cuentas fijas no justifican un sistema multi-proveedor.
   No montar websockets para el aviso de "viendo ahora". Un retraso de pocos segundos con polling es aceptable para este caso de uso.
   No crear entorno de pre hasta que un despliegue arriesgado o una producción rota lo justifiquen (disparador real, no por defecto).
   No hashear la clave de acceso de lista — es intencional, no un olvido.
   No montar Redis/colas para el rate limiting — un contador simple en Postgres o en memoria es suficiente a esta escala.
9. Fichero de estado (Mecanismo B)

Para tareas largas o complejas, se crea un fichero de estado efímero en .claude/state/<nombre-tarea>.md (carpeta con .gitignore, no se versiona). Se elimina o archiva al cerrar la tarea. No confundir con este fichero.

10. Skills del proyecto

Ninguna todavía. Nacen cuando se repita la misma instrucción tres veces en tareas distintas (disparador de la metodología), no antes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
