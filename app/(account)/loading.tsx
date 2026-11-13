/** Скелетон личного кабинета (T-17): навигация и заголовок не «прыгают». */
export default function AccountLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14" aria-busy="true">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <div className="hidden space-y-3 lg:block">
          <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-10 animate-pulse rounded-xl bg-secondary" />
          <div className="h-10 animate-pulse rounded-xl bg-secondary" />
        </div>

        <div>
          <div className="h-4 w-24 animate-pulse rounded-full bg-secondary" />
          <div className="mt-3 h-10 w-2/3 animate-pulse rounded-xl bg-secondary" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Загружаем личный кабинет</span>
    </div>
  );
}
