/** Скелетон карточки выкройки (T-17): страница не показывает пустой экран. */
export default function PatternLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14" aria-busy="true">
      <div className="h-4 w-52 animate-pulse rounded-full bg-secondary" />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div>
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-secondary" />
          <div className="mt-8 h-7 w-40 animate-pulse rounded-full bg-secondary" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full animate-pulse rounded-full bg-secondary" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-secondary" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-secondary" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-card p-6">
            <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
            <div className="mt-4 h-9 w-4/5 animate-pulse rounded-xl bg-secondary" />
            <div className="mt-4 h-9 w-32 animate-pulse rounded-full bg-secondary" />
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/70 pt-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
            <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-secondary" />
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
        </div>
      </div>

      <span className="sr-only">Загружаем выкройку</span>
    </div>
  );
}
