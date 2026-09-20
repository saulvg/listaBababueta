import bcrypt from 'bcryptjs'

// Las cuentas de los padres no están en la base de datos: son dos, fijas, y
// viven en variables de entorno (CLAUDE.md §3 y §5). No hay registro, no hay
// recuperación de contraseña y no hay tabla de usuarios que mantener.
//
// Se usa bcryptjs en vez de bcrypt: es JavaScript puro y no arrastra una
// compilación nativa que en Windows da guerra.

export type ParentAccount = {
  email: string
}

type CuentaConHash = ParentAccount & { passwordHash: string }

/**
 * Hash de pega contra el que se compara cuando el email no existe. Sin esto,
 * un email desconocido respondería en microsegundos y uno válido en ~80 ms,
 * y esa diferencia basta para ir descubriendo qué emails son cuentas reales.
 * Comparando siempre, las dos respuestas tardan lo mismo.
 */
const HASH_SENUELO =
  '$2b$10$3He3h1VstECJW2.eYoYLOeZuIKv7JLf0rAMAyFED3BmkQZxMnv1k6'

/** Forma de un hash bcrypt: $2<letra>$<coste>$<22 de sal + 31 de hash>. */
const FORMA_DE_HASH_BCRYPT = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/

/**
 * Lee las cuentas del entorno. Se hace en cada llamada y no al importar el
 * módulo: si esto se evaluara al cargar, un `.env.local` incompleto tiraría
 * el build entero en vez de fallar solo el login.
 */
export function cuentasDePadres(): CuentaConHash[] {
  const cuentas: CuentaConHash[] = []

  for (const numero of [1, 2]) {
    const email = process.env[`PARENT_${numero}_EMAIL`]?.trim().toLowerCase()
    const passwordHash = process.env[`PARENT_${numero}_PASSWORD_HASH`]?.trim()

    // Una cuenta a medias (email sin hash) se ignora en vez de romper: así la
    // segunda cuenta puede quedarse sin configurar sin bloquear a la primera.
    if (!email || !passwordHash) continue

    // Un hash con la forma cambiada casi siempre significa lo mismo: el
    // cargador de .env de Next (dotenvx) ha interpretado los `$` del hash
    // como variables y se ha comido media cadena. Sin este aviso, el síntoma
    // es un "contraseña incorrecta" eterno y perfectamente inexplicable.
    if (!FORMA_DE_HASH_BCRYPT.test(passwordHash)) {
      console.error(
        `PARENT_${numero}_PASSWORD_HASH no tiene forma de hash bcrypt. ` +
          'Si lo has puesto en .env.local, escapa los dólares ' +
          '(\\$2b\\$10\\$...): Next expande $VAR dentro de los .env, también ' +
          'entre comillas. `pnpm hash:password` ya te lo imprime escapado.',
      )
      continue
    }

    cuentas.push({ email, passwordHash })
  }

  return cuentas
}

/** Los emails a los que se avisa cuando alguien compra un regalo. */
export function emailsDePadres(): string[] {
  return cuentasDePadres().map((cuenta) => cuenta.email)
}

/**
 * Comprueba email + contraseña contra las cuentas del entorno.
 * Devuelve la cuenta si encaja, o `null` si no. Nunca dice cuál de los dos
 * campos falló: eso solo ayuda a quien esté probando suerte.
 */
export async function verificarCredenciales(
  email: string,
  password: string,
): Promise<ParentAccount | null> {
  const cuentas = cuentasDePadres()

  if (cuentas.length === 0) {
    console.error(
      'No hay ninguna cuenta de padres configurada. Revisa PARENT_1_EMAIL y ' +
        'PARENT_1_PASSWORD_HASH en .env.local (ver .env.example).',
    )
    // Aun así se compara contra el señuelo, para no delatar por el tiempo de
    // respuesta que la app está sin configurar.
    await bcrypt.compare(password, HASH_SENUELO)
    return null
  }

  const cuenta = cuentas.find((candidata) => candidata.email === email)
  const hash = cuenta?.passwordHash ?? HASH_SENUELO

  const coincide = await bcrypt.compare(password, hash)

  // `cuenta &&` es imprescindible: sin él, una contraseña que por casualidad
  // casara con el señuelo daría por buena una cuenta inexistente.
  return cuenta && coincide ? { email: cuenta.email } : null
}
