import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resuelve el alias @/* del tsconfig también dentro de los tests.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Los tests hablan con una base de datos real al otro lado de la red:
    // los timeouts por defecto de Vitest se quedan cortos.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Un solo fichero a la vez: varios ficheros escribiendo en la misma rama
    // de Neon se pisarían entre ellos.
    fileParallelism: false,
  },
})
