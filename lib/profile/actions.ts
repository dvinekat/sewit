"use server";

import { revalidatePath } from "next/cache";

import { describeSupabaseError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";
import type { ProfileActionState } from "@/lib/profile/types";
import {
  DELETE_ACCOUNT_FIELDS,
  PROFILE_FIELDS,
  deleteAccountSchema,
  profileNameSchema,
} from "@/lib/schemas/profile";
import { authFieldErrors } from "@/lib/schemas/auth";

/**
 * Профиль и удаление аккаунта (T-37, FR-6.5).
 *
 * Имя пишется только в свою строку `profiles`: RLS `profiles_update_own_or_admin`
 * и грант на колонку `name` не дают сменить роль или чужой профиль.
 * Удаление аккаунта требует service_role — `auth.users` недоступна из клиента, —
 * поэтому шаги идут в порядке, при котором аккаунт нельзя потерять, а ПД
 * не остаются в снапшотах заказов.
 */

function missingConfig(context: "auth" | "service"): ProfileActionState {
  if (context === "service") {
    return {
      status: "error",
      message:
        "Удаление аккаунта недоступно: администратор не добавил SUPABASE_SERVICE_ROLE_KEY в .env.local.",
    };
  }

  return {
    status: "error",
    message: "Профиль недоступен: не настроены переменные Supabase в .env.local.",
  };
}

/** Сохранение имени в профиле (FR-6.5). */
export async function updateNameAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте имя.",
      fieldErrors: authFieldErrors(parsed.error, PROFILE_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig("auth");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Сессия истекла. Войдите заново, чтобы изменить профиль." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: `Не удалось сохранить имя: ${describeSupabaseError(error)}`,
    };
  }

  // Метаданные — резервный источник имени в `getSessionUser`, пока строка
  // профиля не пришла из БД. Ошибка здесь не отменяет сохранение.
  const { error: metadataError } = await supabase.auth.updateUser({
    data: { name: parsed.data.name },
  });

  if (metadataError) console.error("[profile] metadata name", metadataError);

  revalidatePath("/account", "layout");

  return { status: "success", message: "Имя сохранено в профиле." };
}

/**
 * Удаление аккаунта с обезличиванием заказов (FR-6.5).
 *
 * Порядок шагов:
 * 1. стереть мерки из `orders.measurements_snapshot` — это ПД, а заказ остаётся;
 * 2. удалить `auth.users` — каскад стирает профиль, мерки, избранное и права
 *    на скачивание, а `orders.user_id` обнуляется (`on delete set null`);
 * 3. очистить cookie сессии, чтобы кабинет не открывался по старому токену.
 *
 * Если шаг 1 или 2 падает, аккаунт остаётся рабочим: пользователь увидит
 * ошибку и сможет повторить удаление.
 */
export async function deleteAccountAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = deleteAccountSchema.safeParse({
    confirm: formData.get("confirm"),
    acknowledge: formData.get("acknowledge"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Подтвердите удаление аккаунта.",
      fieldErrors: authFieldErrors(parsed.error, DELETE_ACCOUNT_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig("auth");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Сессия истекла. Войдите заново, чтобы удалить аккаунт.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  // Без администратора демо-стенд остаётся без управления каталогом,
  // поэтому роль admin удаляется только вручную через Supabase.
  if (profile?.role === "admin") {
    return {
      status: "error",
      message: "Аккаунт администратора удалить нельзя: сначала снимите роль admin.",
    };
  }

  if (!hasServiceRoleKey()) return missingConfig("service");

  const service = createServiceClient();

  const { error: scrubError } = await service
    .from("orders")
    .update({ measurements_snapshot: null })
    .eq("user_id", user.id);

  if (scrubError) {
    console.error("[profile] orders snapshot scrub", scrubError);
    return {
      status: "error",
      message: "Не удалось удалить персональные данные из заказов. Попробуйте ещё раз.",
    };
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[profile] delete user", deleteError);
    return {
      status: "error",
      message: "Не удалось удалить аккаунт. Попробуйте ещё раз или напишите в поддержку.",
    };
  }

  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Токен уже недействителен: важно лишь стереть cookie, а это делает клиент.
    console.error("[profile] sign out after delete", error);
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Аккаунт удалён.",
    redirectTo: "/account-deleted",
  };
}
