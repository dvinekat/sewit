import Link from "next/link";

import {
  CATALOG_SIZES,
  CATALOG_SORTS,
  PRICE_RANGES,
  SORT_LABELS,
  type CatalogQuery,
} from "@/lib/catalog";
import { getLevelLabel } from "@/lib/format";

const controlClass =
  "mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

const labelClass = "text-xs font-medium text-muted-foreground";

/**
 * Панель фильтров каталога (T-09, T-10, T-11).
 *
 * Обычная GET-форма: состояние уходит в URL, работает без JavaScript и
 * переживает перезагрузку. Кнопка «Показать» применяет всю комбинацию сразу.
 */
export function CatalogFilters({ query }: { query: CatalogQuery }) {
  return (
    <form
      action="/catalog"
      method="get"
      className="rounded-2xl border border-line bg-card p-4 sm:p-5"
      role="search"
      aria-label="Фильтры каталога"
    >
      {query.category ? <input type="hidden" name="category" value={query.category} /> : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <label className="lg:col-span-2">
          <span className={labelClass}>Поиск по названию и описанию</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q ?? ""}
            minLength={2}
            maxLength={100}
            placeholder="Например, платье или худи"
            className={controlClass}
          />
        </label>

        <label>
          <span className={labelClass}>Размер</span>
          <select name="size" defaultValue={query.size ?? ""} className={controlClass}>
            <option value="">Любой</option>
            {CATALOG_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Сложность</span>
          <select
            name="level"
            defaultValue={query.level ? String(query.level) : ""}
            className={controlClass}
          >
            <option value="">Любая</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {getLevelLabel(level)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Цена</span>
          <select name="price" defaultValue={query.price ?? ""} className={controlClass}>
            <option value="">Любая</option>
            {PRICE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Сортировка</span>
          <select name="sort" defaultValue={query.sort} className={controlClass}>
            {CATALOG_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Показать
        </button>
        <Link
          href="/catalog"
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Сбросить фильтры
        </Link>
        <p className="text-xs text-muted-foreground">
          Поиск работает от 2 символов; фильтры сохраняются в ссылке.
        </p>
      </div>
    </form>
  );
}
