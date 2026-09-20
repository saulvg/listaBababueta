1. Qué es esto

App para gestionar listas de regalos (varias listas, no solo una) que los padres crean y mantienen, y que comparten con familiares mediante un enlace con clave de acceso propia por lista. Los familiares pueden marcar productos como comprados para evitar duplicados.

2. Stack
   Next.js (App Router, TypeScript) — frontend y backend en el mismo proyecto.
   Tailwind CSS + shadcn/ui — componentes copiados al proyecto, no dependencia pesada.
   Prisma + Postgres (Neon) — ORM y base de datos gestionada.
   iron-session — sesión de los padres mediante cookie firmada. NO NextAuth (pensado para multi-proveedor, aquí sobra).
   bcryptjs (no bcrypt) — hash de la contraseña de los padres. JavaScript puro: evita la compilación nativa, que en Windows da guerra.
   Zod — validación de todos los formularios (creación de lista, productos, login).
   Resend — email a los padres cuando se marca un producto como comprado.
   Vercel — despliegue. Un único entorno de producción por ahora.

Deliberadamente fuera: NextAuth, websockets, Redis, cola de mensajes, entorno de pre. Ver sección 8 (trampas) para el porqué de cada exclusión.

3. Modelo de datos (resumen)
   Cuentas de los padres — no es una tabla de usuarios. Son DOS cuentas fijas (email + hash bcrypt) en variables de entorno: PARENT_1_* y PARENT_2_*. No hay registro abierto.
   lists: id, título, slug (parte visible de la URL, derivada del título al crear y luego inmutable para no romper enlaces ya compartidos), access_key (texto plano, definida y editable por los padres, único requisito: no vacía), fecha de creación.
   products: id, list_id (FK a lists), título, enlace, precio estimado, comentario, imagen (URL, sin subida de ficheros), estado (disponible / comprado), comprado_por (texto libre, nullable — anónimo si se deja vacío).
   El precio se guarda en CÉNTIMOS como entero (priceCents): evita los errores de coma flotante y no obliga a arrastrar el tipo Decimal de Prisma. La conversión desde euros es cosa del formulario.
   Los campos del esquema van en inglés camelCase con @map a snake_case.
   Soft lock de visualización: columna(s) en products o tabla aparte — quién lo está viendo ahora mismo (id de sesión) y desde cuándo, con expiración corta (3–5 min). Es solo UX, no la garantía real de no-doble-compra (ver sección 5). TODO: las columnas (viewer_id, viewing_from) existen pero NO hay nada implementado todavía; se monta cuando haya UI con la que juzgar si el aviso ayuda o estorba.
4. Convenciones de carpetas y estilo
   App Router de Next.js: rutas públicas bajo un grupo (public), panel de administración de los padres bajo (admin).
   Lógica de servidor en app/api/\* como Route Handlers, no Server Actions sueltas repartidas por los componentes — mantiene la lógica de negocio centralizada y fácil de testear.
   Dentro de app/api la frontera de seguridad está en la URL: app/api/admin/\* exige sesión de padres (requireParent) y app/api/public/\* no. Está en la ruta y no en un middleware para que al revisar un fichero se vea de qué lado cae sin abrir nada más.
   Si una página renderizada en servidor necesitara leer datos, la salida NO es saltarse esta regla ni duplicar consultas: es importar las mismas funciones de lib/ que usa el Route Handler.
   Todos los handlers se exportan envueltos en route() (lib/api/route.ts): traduce ApiError y ZodError a respuestas HTTP y evita que un fallo inesperado salga con su traza. Es opt-in — un handler nuevo que no lo use se queda sin red.
   Respuesta uniforme: el éxito devuelve el objeto; el error devuelve { error: { code, message, details? } }, con code para el código (un switch en el frontal) y message para la persona.
   Esquemas de validación Zod en lib/validations/, uno por entidad (list.ts, product.ts, auth.ts).
   Cliente de Prisma como singleton en lib/db.ts (patrón estándar de Next.js para evitar múltiples conexiones en desarrollo). Prisma 7 ya no admite url ni directUrl en el datasource del schema: van en prisma.config.ts, el cliente se genera en lib/generated/ (no versionado) y la conexión de runtime entra por un driver adapter.
   Formato con Prettier (.prettierrc.json: semi false, singleQuote true). `pnpm format` y `pnpm format:check`.

   ### Convención de commits

   Los commits los ejecuta siempre la persona, nunca el agente (bloqueado
   además por permisos en `.claude/settings.json`). Ver skill
   `proposing-commits` para el criterio de cuándo avisar y cómo proponer
   el mensaje.

5. Decisiones de arquitectura (el porqué, no solo el qué)
   Anti-doble-compra real: una transacción que actualiza el estado del producto SOLO SI sigue en disponible. Si la transacción no afecta ninguna fila, el servidor responde con error y el frontend avisa de que ya fue comprado. Esta es la única garantía dura.
   El paso a COMPRADO solo ocurre por markProductAsPurchased (lib/products/purchase.ts). El PATCH de productos de los padres NO puede tocar status, purchased_by ni purchased_at — el esquema de Zod ni siquiera acepta esos campos —, porque un PATCH genérico que escribiera el estado sería una puerta trasera a la garantía anterior. Queda pendiente, y sin endpoint hoy, desmarcar un regalo comprado por error.
   "Alguien lo está mirando": aviso cosmético mediante polling (cada pocos segundos), no websockets. Es solo UX; la garantía real vive en el punto anterior. TODO: sin implementar (ver sección 3).
   Autenticación de los padres: iron-session + bcryptjs, sin tabla de usuarios. Cuentas fijas en variables de entorno.
   Dos cookies de sesión separadas, no una: bababueta_padres (email) y bababueta_invitado (viewerId + unlockedListIds). Separadas para que cerrar sesión en el panel no borre el acceso de la familia a las listas, ni al revés. Ambas httpOnly y sameSite lax: lax deja que el enlace compartido por WhatsApp llegue con la cookie puesta, y aun así frena los POST cross-site (CSRF).
   El índice de listas es público: cualquiera que abra la app ve los TÍTULOS de todas las listas. La clave protege el contenido de cada lista, no su existencia. A cambio, un familiar no depende de que le manden el enlace exacto: entra, ve "Reyes 2026" y mete la clave.
   Los padres con sesión abierta entran en cualquier lista sin teclear su clave: son los dueños, obligarles no protege de nada.
   Clave de acceso por lista: en texto plano en la base de datos, porque los padres necesitan poder volver a verla para compartirla o recordarla — hashear algo que hay que volver a mostrar no tiene sentido. Validación mínima: no vacía.
   Múltiples listas: lists es una tabla propia con access_key individual; cada lista tiene su propia URL (/lista/<slug>) y su propia sesión de acceso (entrar a una lista no da acceso a las demás).
6. Seguridad
   Contraseña de la cuenta familiar: hash bcrypt guardado en variable de entorno, nunca texto plano.
   Clave de acceso de cada lista: texto plano en base de datos (justificado arriba), pero protegida con rate limiting por IP/sesión en el endpoint de acceso, porque la elige un humano y puede ser corta.
   Rate limiting también en el login de los padres.
   Todas las entradas de formulario pasan por Zod antes de tocar la base de datos.
   Variables sensibles (hash de contraseña, cadena de conexión a la base de datos, API key de Resend) solo en .env.local, nunca commiteadas. Ver .env.example para la lista de variables esperadas, sin valores reales.
7. Cómo se lanzan los tests

Vitest: `pnpm test`. Los tests hablan con una base de datos real (la rama `test` de Neon, en TEST_DATABASE_URL) porque lo que prueban es atomicidad, y eso un mock no puede demostrarlo.

Solo hay una batería, la de anti-doble-compra (sección 5), y es deliberado: es la única pieza del proyecto con caso límite de concurrencia real, y por tanto la única que justifica criterios de aceptación definidos por adelantado según la metodología. El resto de tareas van con señal mínima (compila, type-checker en verde, prueba manual con curl).

8. Trampas conocidas / decisiones que no hay que revisar sin motivo
   No montar NextAuth. Dos cuentas fijas no justifican un sistema multi-proveedor.
   No montar websockets para el aviso de "viendo ahora". Un retraso de pocos segundos con polling es aceptable para este caso de uso.
   No crear entorno de pre hasta que un despliegue arriesgado o una producción rota lo justifiquen (disparador real, no por defecto).
   No hashear la clave de acceso de lista — es intencional, no un olvido.
   No montar Redis/colas para el rate limiting — un contador simple en Postgres o en memoria es suficiente a esta escala. Hoy es en memoria (lib/rate-limit.ts), con lo que implica: en Vercel cada instancia tiene su contador y se vacía en cada arranque en frío. Frena al que prueba claves a mano, que es el riesgo real aquí. Si algún día no bastara, el sustituto es una tabla en Postgres, no un Redis.
   Los $ de un hash bcrypt hay que ESCAPARLOS en .env.local (\$2b\$10\$...). El cargador de .env de Next 16 expande $VAR dentro de los valores, también entre comillas simples y dobles, y se come media cadena: el síntoma es un "email o contraseña incorrectos" eterno y sin pista. En Vercel es al revés, ahí va tal cual. `pnpm hash:password` imprime las dos formas y lib/auth/parents.ts avisa por consola si el hash llega deformado.
   `next dev` añade solo un bloque "nextjs-agent-rules" al final de este fichero y lo recrea en cada arranque. Si molesta, se desactiva con agentRules: false en next.config.ts.
9. Fichero de estado (Mecanismo B)

Para tareas largas o complejas, se crea un fichero de estado efímero en .claude/state/<nombre-tarea>.md (carpeta con .gitignore, no se versiona). Se elimina o archiva al cerrar la tarea. No confundir con este fichero.

10. Skills del proyecto

Ninguna todavía. Nacen cuando se repita la misma instrucción tres veces en tareas distintas (disparador de la metodología), no antes.
