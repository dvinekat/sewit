"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthAlert, AuthField } from "@/components/auth/form-parts";
import { buttonVariants } from "@/components/ui/button";
import { createCategoryAction, updateCategoryAction } from "@/lib/admin/category-actions";
import { initialAdminState } from "@/lib/admin/form-state";
import { slugify } from "@/lib/admin/pattern-form";
import { cn } from "@/lib/utils";

export interface CategoryFormValues {
  id?: string;
  slug: string;
  title: string;
  sort: string;
}

function SubmitCategoryButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants({ size: "default" }))}>
      {pending ? "Сохраняем…" : mode === "edit" ? "Сохранить категорию" : "Создать категорию"}
    </button>
  );
}

/**
 * Форма категории (T-40, FR-8.3): одна на создание и редактирование.
 *
 * Slug можно не придумывать вручную — он генерируется из названия кнопкой.
 * Поле контролируемое, чтобы ошибка сервера не стирала ввод.
 */
export function CategoryForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: CategoryFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "edit" ? updateCategoryAction : createCategoryAction,
    initialAdminState,
  );
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));

  function update<K extends keyof CategoryFormValues>(field: K, value: CategoryFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={formAction} noValidate className="mt-4 space-y-4">
      {mode === "edit" && initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.status === "error" && state.message ? <AuthAlert>{state.message}</AuthAlert> : null}

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
            label="Slug"
            required
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              update("slug", event.target.value.toLowerCase());
            }}
            hint="Латиница, цифры и дефис: /catalog?category=dresses-kids"
            error={state.fieldErrors?.slug}
            className="lowercase"
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

        <label className="block">
          <span className="text-sm font-medium text-foreground">Порядок в навигации</span>
          <input
            type="number"
            name="sort"
            min={0}
            max={999}
            step={1}
            value={values.sort}
            onChange={(event) => update("sort", event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.sort)}
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {state.fieldErrors?.sort ? (
            <span className="mt-1 block text-xs text-destructive">{state.fieldErrors.sort}</span>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">
              Меньше — выше в списке категорий.
            </span>
          )}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitCategoryButton mode={mode} />
        <Link
          href="/admin/categories"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
