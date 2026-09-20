#!/usr/bin/env node
// Genera el hash bcrypt de una contraseña de los padres, para pegarlo en
// PARENT_1_PASSWORD_HASH o PARENT_2_PASSWORD_HASH dentro de .env.local
// (CLAUDE.md §6: en el entorno solo vive el hash, nunca la contraseña).
//
//   pnpm hash:password
//
// Pide la contraseña por teclado y NO la escribe en ningún fichero. Se puede
// pasar como argumento (`pnpm hash:password "mi contraseña"`), pero entonces
// queda registrada en el historial del terminal: mejor por teclado.

import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

import bcrypt from 'bcryptjs'

// 10 rondas: el equilibrio habitual. Subirlo tiene coste real aquí porque
// bcryptjs es JavaScript puro, más lento que la versión nativa, y esto se
// ejecuta en cada login.
const RONDAS = 10

async function pedirContrasena() {
  const desdeArgumento = process.argv[2]
  if (desdeArgumento) return desdeArgumento

  const rl = createInterface({ input: stdin, output: stdout })
  try {
    return await rl.question('Contraseña: ')
  } finally {
    rl.close()
  }
}

const contrasena = await pedirContrasena()

if (!contrasena) {
  console.error('No has escrito ninguna contraseña.')
  process.exit(1)
}

const hash = await bcrypt.hash(contrasena, RONDAS)

// Los $ van escapados a propósito. El cargador de .env de Next 16 (dotenvx)
// interpreta $LO_QUE_SEA como una variable y se come medio hash, y lo hace
// igual entre comillas simples que dobles: solo respeta \$. Sin escapar, el
// login falla siempre y el mensaje no da ninguna pista.
const paraEnvLocal = hash.replaceAll('$', '\\$')

console.log('\nPega esta línea en .env.local (cambia el 1 por el 2 si es la')
console.log('segunda cuenta):\n')
console.log(`PARENT_1_PASSWORD_HASH=${paraEnvLocal}\n`)
console.log('Los \\$ son necesarios: Next expande $VAR dentro de los .env.')
console.log('En Vercel es al revés — ahí se pega el hash tal cual:\n')
console.log(`${hash}\n`)
