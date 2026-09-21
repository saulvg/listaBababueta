// Modo claro / oscuro a mano, sin next-themes (CLAUDE.md §8: no se añade un
// paquete para lo que cabe en sesenta líneas).
//
// El problema de verdad de un interruptor de tema no es el interruptor: es que
// el navegador pinta la página en claro antes de que React arranque y el
// primer fotograma sale en blanco. Por eso SCRIPT_DE_TEMA va inline en el
// <head> y se ejecuta antes de que exista nada más.

export const CLAVE_TEMA = 'bababueta-tema'

export type Tema = 'claro' | 'oscuro'

/**
 * Script que se inyecta tal cual en el <head>. Va en una cadena y no como
 * función importada porque tiene que correr ANTES del primer pintado, o sea
 * antes de que cargue ningún bundle.
 *
 * Sin tema guardado manda la preferencia del sistema; en cuanto alguien pulsa
 * el interruptor, manda su elección. No hay opción "automático" en la UI: con
 * dos estados el botón se entiende sin explicarlo.
 */
export const SCRIPT_DE_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem('${CLAVE_TEMA}')
    var oscuro = guardado
      ? guardado === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    var raiz = document.documentElement
    raiz.classList.toggle('dark', oscuro)
    // Para que los controles nativos (scrollbars, autocompletado) acompañen.
    raiz.style.colorScheme = oscuro ? 'dark' : 'light'
  } catch (e) {}
})()
`.trim()

/** Cambia de tema y lo recuerda. Solo en el navegador. */
export function alternarTema(): Tema {
  const raiz = document.documentElement
  const oscuro = !raiz.classList.contains('dark')

  raiz.classList.toggle('dark', oscuro)
  raiz.style.colorScheme = oscuro ? 'dark' : 'light'

  const tema: Tema = oscuro ? 'oscuro' : 'claro'

  try {
    localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // Navegación privada o almacenamiento bloqueado: el tema cambia igual,
    // simplemente no se recuerda al recargar.
  }

  return tema
}
