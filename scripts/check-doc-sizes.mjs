#!/usr/bin/env node
// Comprobación informativa del tamaño de CLAUDE.md y de los SKILL.md del
// proyecto. Nunca falla: se ejecuta a mano, no bloquea commits ni build.

import { glob, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HARD_LIMIT = 500
const SOFT_LIMIT = 300

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

async function collectDocs() {
  const docs = ['CLAUDE.md']
  for await (const entry of glob('.claude/skills/**/SKILL.md', {
    cwd: projectRoot,
  })) {
    docs.push(entry.split(path.sep).join('/'))
  }
  return docs
}

async function countLines(relativePath) {
  try {
    const content = await readFile(path.join(projectRoot, relativePath), 'utf8')
    if (content === '') return 0
    const lines = content.split('\n')
    // Un salto de línea final no cuenta como línea extra.
    if (lines.at(-1) === '') lines.pop()
    return lines.length
  } catch {
    return null
  }
}

const docs = await collectDocs()
const exceedsHard = []
const exceedsSoft = []
const missing = []
const ok = []

for (const doc of docs) {
  const lines = await countLines(doc)
  if (lines === null) {
    missing.push(doc)
  } else if (lines > HARD_LIMIT) {
    exceedsHard.push({ doc, lines })
  } else if (lines > SOFT_LIMIT) {
    exceedsSoft.push({ doc, lines })
  } else {
    ok.push({ doc, lines })
  }
}

console.log(`Revisando ${docs.length} documento(s)...\n`)

for (const { doc, lines } of exceedsHard) {
  console.log(
    `✗ ${doc}: ${lines} líneas — límite duro superado (${HARD_LIMIT}), plantéate partirlo.`,
  )
}

for (const { doc, lines } of exceedsSoft) {
  console.log(
    `! ${doc}: ${lines} líneas — umbral blando superado (${SOFT_LIMIT}).`,
  )
}

for (const doc of missing) {
  console.log(`? ${doc}: no se ha podido leer, se omite.`)
}

if (exceedsHard.length === 0 && exceedsSoft.length === 0) {
  console.log(`✓ Todo en rango (≤ ${SOFT_LIMIT} líneas):`)
  for (const { doc, lines } of ok) {
    console.log(`  · ${doc}: ${lines} líneas`)
  }
}

// Informativo: siempre salida 0.
process.exit(0)
