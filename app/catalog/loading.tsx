export default function CatalogLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14" aria-busy="true">
      <div className="h-4 w-28 animate-pulse rounded-full bg-secondary" />
      <div className="mt-6 h-11 w-2/3 max-w-md animate-pulse rounded-xl bg-secondary" />
      <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded-full bg-secondary" />

      <div className="mt-8 flex flex-wrap gap-2 border-b border-line/70 pb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 w-24 animate-pulse rounded-full bg-secondary" />
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-line bg-card"
            aria-hidden="true"
          >
            <div className="aspect-[4/3] animate-pulse bg-secondary" />
            <div className="space-y-3 p-5">
              <div className="h-6 w-2/3 animate-pulse rounded-full bg-secondary" />
              <div className="h-4 w-full animate-pulse rounded-full bg-secondary" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-secondary" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Загружаем каталог</span>
    </div>
  );
}
