// Landing pública. Los familiares no llegan aquí, llegan a /lista/<slug>
// con el enlace que les pasan los padres. Esta página solo da entrada al
// panel de administración.
export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Lista Bababueta</h1>
      <p className="text-neutral-600">
        Listas de regalos para compartir con la familia, sin que nadie repita
        compra.
      </p>
    </main>
  )
}
