"use server";

import { revalidatePath } from "next/cache";

import type { MeasurementsActionResult } from "@/lib/measurements/types";
import { measurementsSchema } from "@/lib/schemas/measurements";
import { describeSupabaseError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Сохранение и удаление мерок (T-19, FR-3.4).
 *
 * Мерки — персональные данные, поэтому запись идёт только серверным экшеном:
 * RLS `measurements_insert_own` / `measurements_update_own` разрешает строку
 * лишь владельцу, а `user_id` берётся из проверенной сессии, не из формы.
 */

export async function saveMeasurementsAction(input: unknown): Promise<MeasurementsActionResult> {
  const parsed = measurementsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Проверьте значения мерок.",
    };
  }

  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Сохранение мерок недоступно: не настроен Supabase." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Войдите, чтобы сохранить мерки в профиле." };
  }

  const { error } = await supabase
    .from("measurements")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) {
    return {
      status: "error",
      message: `Не удалось сохранить мерки: ${describeSupabaseError(error)}`,
    };
  }

  revalidatePath("/account");
  return { status: "success", message: "Мерки сохранены в профиле.", values: parsed.data };
}

export async function deleteMeasurementsAction(): Promise<MeasurementsActionResult> {
  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Удаление мерок недоступно: не настроен Supabase." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Войдите, чтобы управлять сохранёнными мерками." };
  }

  const { error } = await supabase.from("measurements").delete().eq("user_id", user.id);

  if (error) {
    return {
      status: "error",
      message: `Не удалось удалить мерки: ${describeSupabaseError(error)}`,
    };
  }

  revalidatePath("/account");
  return { status: "success", message: "Сохранённые мерки удалены." };
}
