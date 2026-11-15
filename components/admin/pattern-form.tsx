"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthAlert, AuthField } from "@/components/auth/form-parts";
import { buttonVariants } from "@/components/ui/button";
import { createPatternAction, updatePatternAction } from "@/lib/admin/pattern-actions";
import { initialAdminState } from "@/lib/admin/form-state";
import {
  publishBlockers,
  slugify,
  type ParamRowInput,
  type SizeRowInput,
} from "@/lib/admin/pattern-form";
import type { AdminCategoryOption } from "@/lib/admin/pattern-queries";
import { cn } from "@/lib/utils";

export interface PatternFormInitial {
  id?: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  level: string;
  sewingHours: string;
  priceRubles: string;
  fabricNote: string;
  materials: string;
  allowances: string;
  status: "draft" | "published";
  coverUrl: string;
  model3dUrl: string;
  sizes: SizeRowInput[];
  params: ParamRowInput[];
}

const PARAM_OPTIONS = [
  { code: "length", label: "Длина" },
  { code: "sleeve", label: "Рукав" },
  { code: "neckline", label: "Горловина" },
  { code: "fit", label: "Посадка" },
] as const;

const LEVELS = [
  { value: "1", label: "1 — низкая" },
  { value: "2", label: "2 — ниже среднего" },
  { value: "3", label: "3 — средняя" },
  { value: "4", label: "4 — выше среднего" },
  { value: "5", label: "5 — высокая" },
];

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";
const areaClass =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40";

let rowCounter = 0;

function newRowKey(): string {
  rowCounter += 1;
  return `new-${rowCounter}`;
}

function SubmitPatternButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: "default" }), "min-w-44")}
    >
      {pending ? "Сохраняем…" : mode === "edit" ? "Сохранить выкройку" : "Создать выкройку"}
    </button>
  );
}

/**
 * Форма выкройки (T-39, FR-8.2).
 *
 * Одна на создание и редактирование. Таблица размеров и параметры — динамические
 * списки: на сервер уходят JSON-строками в скрытых полях. PDF загружается
 * отдельным полем на каждый размер, имя поля — `pdf:<размер>`.
 */
export function PatternForm({
  initial,
  categories,
}: {
  initial: PatternFormInitial;
  categories: AdminCategoryOption[];
}) {
  const mode = initial.id ? "edit" : "create";
  const [state, formAction] = useActionState(
    mode === "edit" ? updatePatternAction : createPatternAction,
    initialAdminState,
  );
  const [values, setValues] = useState(initial);
  const [sizes, setSizes] = useState<SizeRowInput[]>(initial.sizes);
  const [params, setParams] = useState<ParamRowInput[]>(initial.params);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [hasCoverFile, setHasCoverFile] = useState(false);
  const [pendingPdfs, setPendingPdfs] = useState<Record<string, boolean>>({});

  function update<K extends keyof PatternFormInitial>(field: K, value: PatternFormInitial[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateSize(key: string, field: keyof SizeRowInput, value: string) {
    setSizes((current) =>
      current.map((size) => (size.key === key ? { ...size, [field]: value } : size)),
    );
  }

  function addSize() {
    setSizes((current) => [
      ...current,
      {
        key: newRowKey(),
        label: "",
        bust: "",
        waist: "",
        hips: "",
        heightMin: "160",
        heightMax: "176",
        fabricConsumption: "1.5",
        hasFile: false,
      },
    ]);
  }

  function addParam() {
    const used = new Set(params.map((param) => param.code));
    const next = PARAM_OPTIONS.find((option) => !used.has(option.code));
    if (!next) return;

    setParams((current) => [
      ...current,
      { code: next.code, title: next.label, values: [{ value: "", title: "", available: true }] },
    ]);
  }

  const publishedBlockers = publishBlockers({
    status: values.status,
    coverUrl: hasCoverFile ? "uploaded" : values.coverUrl,
    sizes: sizes.map((size) => ({
      label: size.label,
      hasFile: size.hasFile || Boolean(pendingPdfs[size.label.trim()]),
    })),
  });

  const sizesJson = JSON.stringify(sizes.map(({ key: _key, hasFile: _hasFile, ...size }) => size));

  return (
    <form action={formAction} noValidate className="mt-4 space-y-6">
      {mode === "edit" && initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="sizes" value={sizesJson} />
      <input type="hidden" name="params" value={JSON.stringify(params)} />

      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

      <section aria-labelledby="basics" className="space-y-4">
        <h2 id="basics" className="font-display text-xl">
          Основное
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            name="title"
            label="Название"
            required
            value={values.title}
            onChange={(event) => {
              const title = event.target.value;
              update("title", title);
              if (!slugTouched) update("slug", slugify(title));
            }}
            error={state.fieldErrors?.title}
          />

          <div className="space-y-1.5">
            <AuthField
              name="slug"
              label="Slug (адрес карточки)"
              required
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", event.target.value.toLowerCase());
              }}
              hint="Латиница, цифры и дефис: /patterns/slip-dress"
              error={state.fieldErrors?.slug}
            />
            <button
              type="button"
              onClick={() => {
                setSlugTouched(true);
                update("slug", slugify(values.title));
              }}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Сгенерировать из названия
            </button>
          </div>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Описание</span>
            <textarea
              name="description"
              rows={5}
              required
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.description)}
              className={cn(areaClass, "mt-1.5")}
            />
            {state.fieldErrors?.description ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.description}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Категория</span>
            <select
              name="categoryId"
              required
              value={values.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.categoryId)}
              className={cn(inputClass, "mt-1.5")}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
            {state.fieldErrors?.categoryId ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.categoryId}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Сложность</span>
            <select
              name="level"
              value={values.level}
              onChange={(event) => update("level", event.target.value)}
              className={cn(inputClass, "mt-1.5")}
            >
              {LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Время пошива, ч</span>
            <input
              type="number"
              name="sewingHours"
              min={0.5}
              max={100}
              step={0.5}
              required
              value={values.sewingHours}
              onChange={(event) => update("sewingHours", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.sewingHours)}
              className={cn(inputClass, "mt-1.5")}
            />
            {state.fieldErrors?.sewingHours ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.sewingHours}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Цена, ₽</span>
            <input
              type="text"
              inputMode="decimal"
              name="priceRubles"
              required
              placeholder="1 990"
              value={values.priceRubles}
              onChange={(event) => update("priceRubles", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.priceRubles)}
              className={cn(inputClass, "mt-1.5")}
            />
            {state.fieldErrors?.priceRubles ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.priceRubles}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Ткань и расход</span>
            <input
              name="fabricNote"
              required
              value={values.fabricNote}
              onChange={(event) => update("fabricNote", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.fabricNote)}
              className={cn(inputClass, "mt-1.5")}
            />
            {state.fieldErrors?.fabricNote ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.fabricNote}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">Припуски</span>
            <input
              name="allowances"
              required
              value={values.allowances}
              onChange={(event) => update("allowances", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.allowances)}
              className={cn(inputClass, "mt-1.5")}
            />
            {state.fieldErrors?.allowances ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.allowances}
              </span>
            ) : null}
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Материалы (по одному в строке)
            </span>
            <textarea
              name="materials"
              rows={4}
              value={values.materials}
              onChange={(event) => update("materials", event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.materials)}
              className={cn(areaClass, "mt-1.5")}
              placeholder={"Ткань\nНитки\nМолния 20 см"}
            />
            {state.fieldErrors?.materials ? (
              <span className="mt-1 block text-xs text-destructive">
                {state.fieldErrors.materials}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section aria-labelledby="cover" className="space-y-3">
        <h2 id="cover" className="font-display text-xl">
          Обложка
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Фото нужно для публикации: без него карточка покажет иллюстрацию-заглушку. JPEG, PNG или
          WebP до 5 МБ.
        </p>

        {values.coverUrl ? (
          <p className="text-xs break-all text-muted-foreground">Текущая: {values.coverUrl}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            name="coverUrl"
            label="URL обложки"
            value={values.coverUrl}
            onChange={(event) => update("coverUrl", event.target.value)}
            placeholder="https://…/covers/…"
            hint="Можно вставить ссылку или загрузить файл ниже."
            error={state.fieldErrors?.coverUrl}
          />

          <label className="block">
            <span className="text-sm font-medium text-foreground">Загрузить обложку</span>
            <input
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => setHasCoverFile(Boolean(event.target.files?.length))}
              className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="model3d" className="space-y-3">
        <h2 id="model3d" className="font-display text-xl">
          3D-модель
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Необязательно: файл `.glb` до 5 МБ для будущего 3D-вьюера (T-43). Пока карточка показывает
          обложку; модель хранится в публичном бакете `models` и станет доступна в вьюере.
        </p>

        {values.model3dUrl ? (
          <p className="text-xs break-all text-muted-foreground">Текущая: {values.model3dUrl}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            name="model3dUrl"
            label="URL модели"
            value={values.model3dUrl}
            onChange={(event) => update("model3dUrl", event.target.value)}
            placeholder="https://…/models/…glb"
            hint="Можно вставить ссылку или загрузить файл справа."
            error={state.fieldErrors?.model3dUrl}
          />

          <label className="block">
            <span className="text-sm font-medium text-foreground">Загрузить .glb</span>
            <input
              type="file"
              name="model3d"
              accept=".glb,model/gltf-binary"
              className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="sizes" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sizes" className="font-display text-xl">
            Таблица размеров и PDF
          </h2>
          <button
            type="button"
            onClick={addSize}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Добавить размер
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          На каждый размер загрузите PDF A4 (до 10 МБ). Удалять размеры с покупками нельзя — сервер
          остановит сохранение.
        </p>

        {state.fieldErrors?.sizes ? (
          <p className="text-xs text-destructive">{state.fieldErrors.sizes}</p>
        ) : null}

        {sizes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-4 text-sm text-muted-foreground">
            Пока ни одного размера: у черновика таблица может быть пустой, для публикации нужен хотя
            бы один размер с PDF.
          </p>
        ) : (
          <div className="space-y-3">
            {sizes.map((size) => (
              <div key={size.key} className="rounded-2xl border border-line bg-card p-3">
                <div className="grid gap-2 sm:grid-cols-[70px_repeat(4,1fr)_repeat(2,1fr)]">
                  {(
                    [
                      { field: "label", label: "Размер" },
                      { field: "bust", label: "ОГ" },
                      { field: "waist", label: "ОТ" },
                      { field: "hips", label: "ОБ" },
                      { field: "heightMin", label: "Рост от" },
                      { field: "heightMax", label: "Рост до" },
                      { field: "fabricConsumption", label: "Ткань, м" },
                    ] as const
                  ).map((item) => (
                    <label key={item.field} className="block">
                      <span className="text-[11px] text-muted-foreground">{item.label}</span>
                      <input
                        type={item.field === "label" ? "text" : "number"}
                        step={item.field === "label" ? undefined : "0.5"}
                        value={size[item.field]}
                        onChange={(event) => updateSize(size.key, item.field, event.target.value)}
                        aria-label={`${item.label} для размера ${size.label || "без подписи"}`}
                        className={cn(inputClass, "mt-1 h-9")}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    PDF
                    <input
                      type="file"
                      name={`pdf:${size.label.trim()}`}
                      accept="application/pdf"
                      disabled={!size.label.trim()}
                      onChange={(event) =>
                        setPendingPdfs((current) => ({
                          ...current,
                          [size.label.trim()]: Boolean(event.target.files?.length),
                        }))
                      }
                      className="block text-xs file:mr-2 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
                    />
                  </label>

                  {size.hasFile ? <span className="text-xs text-sage">PDF загружен</span> : null}

                  <button
                    type="button"
                    onClick={() =>
                      setSizes((current) => current.filter((row) => row.key !== size.key))
                    }
                    className="ml-auto text-xs text-destructive underline-offset-4 hover:underline"
                  >
                    Убрать размер
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="params" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="params" className="font-display text-xl">
            Параметры модели
          </h2>
          <button
            type="button"
            onClick={addParam}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            disabled={params.length >= PARAM_OPTIONS.length}
          >
            Добавить параметр
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Снятая галочка «Доступно» помечает комбинацию как «в разработке» — купить её нельзя. Без
          параметров карточка показывает базовый вариант.
        </p>

        {params.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-4 text-sm text-muted-foreground">
            Параметров нет: выкройка продаётся одним базовым вариантом.
          </p>
        ) : (
          <div className="space-y-3">
            {params.map((param, paramIndex) => (
              <div key={param.code} className="rounded-2xl border border-line bg-card p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block w-40">
                    <span className="text-[11px] text-muted-foreground">Параметр</span>
                    <select
                      value={param.code}
                      onChange={(event) =>
                        setParams((current) =>
                          current.map((row, index) =>
                            index === paramIndex ? { ...row, code: event.target.value } : row,
                          ),
                        )
                      }
                      className={cn(inputClass, "mt-1 h-9")}
                    >
                      {PARAM_OPTIONS.map((option) => (
                        <option
                          key={option.code}
                          value={option.code}
                          disabled={
                            option.code !== param.code &&
                            params.some((row) => row.code === option.code)
                          }
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block min-w-48 flex-1">
                    <span className="text-[11px] text-muted-foreground">Название на карточке</span>
                    <input
                      value={param.title}
                      onChange={(event) =>
                        setParams((current) =>
                          current.map((row, index) =>
                            index === paramIndex ? { ...row, title: event.target.value } : row,
                          ),
                        )
                      }
                      className={cn(inputClass, "mt-1 h-9")}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setParams((current) => current.filter((_, index) => index !== paramIndex))
                    }
                    className="ml-auto text-xs text-destructive underline-offset-4 hover:underline"
                  >
                    Убрать параметр
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {param.values.map((value, valueIndex) => (
                    <div key={valueIndex} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]">
                      <input
                        value={value.value}
                        onChange={(event) =>
                          setParams((current) =>
                            current.map((row, index) =>
                              index === paramIndex
                                ? {
                                    ...row,
                                    values: row.values.map((item, itemIndex) =>
                                      itemIndex === valueIndex
                                        ? { ...item, value: event.target.value }
                                        : item,
                                    ),
                                  }
                                : row,
                            ),
                          )
                        }
                        placeholder="код: midi"
                        aria-label="Код значения"
                        className={cn(inputClass, "h-9")}
                      />
                      <input
                        value={value.title}
                        onChange={(event) =>
                          setParams((current) =>
                            current.map((row, index) =>
                              index === paramIndex
                                ? {
                                    ...row,
                                    values: row.values.map((item, itemIndex) =>
                                      itemIndex === valueIndex
                                        ? { ...item, title: event.target.value }
                                        : item,
                                    ),
                                  }
                                : row,
                            ),
                          )
                        }
                        placeholder="Подпись: Миди"
                        aria-label="Подпись значения"
                        className={cn(inputClass, "h-9")}
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={value.available}
                          onChange={(event) =>
                            setParams((current) =>
                              current.map((row, index) =>
                                index === paramIndex
                                  ? {
                                      ...row,
                                      values: row.values.map((item, itemIndex) =>
                                        itemIndex === valueIndex
                                          ? { ...item, available: event.target.checked }
                                          : item,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                          className="size-4 rounded border-line"
                        />
                        Доступно
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setParams((current) =>
                            current.map((row, index) =>
                              index === paramIndex
                                ? {
                                    ...row,
                                    values: row.values.filter(
                                      (_, itemIndex) => itemIndex !== valueIndex,
                                    ),
                                  }
                                : row,
                            ),
                          )
                        }
                        className="text-xs text-destructive underline-offset-4 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setParams((current) =>
                      current.map((row, index) =>
                        index === paramIndex
                          ? {
                              ...row,
                              values: [...row.values, { value: "", title: "", available: true }],
                            }
                          : row,
                      ),
                    )
                  }
                  className="mt-2 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Добавить значение
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="publish" className="space-y-3">
        <h2 id="publish" className="font-display text-xl">
          Статус
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Статус выкройки</span>
            <select
              name="status"
              value={values.status}
              onChange={(event) =>
                update("status", event.target.value === "published" ? "published" : "draft")
              }
              className={cn(inputClass, "mt-1.5")}
            >
              <option value="draft">Черновик — виден только админу</option>
              <option value="published">Опубликована — видна в каталоге</option>
            </select>
          </label>
        </div>

        {values.status === "published" && publishedBlockers.length > 0 ? (
          <div className="rounded-2xl border border-primary/20 bg-secondary/40 p-4 text-sm leading-relaxed">
            <p className="font-medium">Публикация пока невозможна:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {publishedBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Сохраним как черновик — опубликуете, когда всё будет готово.
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitPatternButton mode={mode} />
        <Link
          href="/admin/patterns"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
