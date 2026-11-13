"use server";

import type { AuthActionState } from "@/lib/auth/form-state";
import { describeAuthError } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  LOGIN_FIELDS,
  REGISTER_FIELDS,
  RESET_FIELDS,
  UPDATE_PASSWORD_FIELDS,
  authFieldErrors,
  loginSchema,
  registerSchema,
  resetRequestSchema,
  updatePasswordSchema,
} from "@/lib/schemas/auth";
import { site } from "@/lib/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Серверные экшены авторизации (T-05, FR-6.1, FR-9.3).
 *
 * Пароли и согласие никогда не валидируются только в браузере: каждый экшен
 * заново разбирает FormData, проверяет схему и лишь потом обращается к Supabase.
 * Cookie сессии пишет `@supabase/ssr` прямо из серверного клиента.
 */

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  const values: Record<string, FormDataEntryValue> = {};

  for (const [key, value] of formData.entries()) {
    values[key] = value;
  }

  return values;
}

function missingConfig(): AuthActionState {
  return {
    status: "error",
    message: "Сервис авторизации не настроен. Проверьте переменные Supabase в .env.local.",
  };
}

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте e-mail и пароль.",
      fieldErrors: authFieldErrors(parsed.error, LOGIN_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  // Не redirect() из экшена: он делает мягкую навигацию, при которой
  // singleton Supabase-клиента в шапке остался бы без сессии. Полная
  // загрузка по redirectTo переинициализирует клиент с новой cookie.
  return { status: "success", redirectTo: safeNextPath(String(formData.get("next") ?? "")) };
}

export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля формы.",
      fieldErrors: authFieldErrors(parsed.error, REGISTER_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Согласие на обработку ПД — часть профиля регистрации (FR-9.3):
      // кладём отметку в метаданные пользователя, отдельная колонка не нужна.
      data: {
        name: parsed.data.name,
        consent_at: new Date().toISOString(),
      },
      emailRedirectTo: `${site.url}/auth/callback?next=/account`,
    },
  });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  // Supabase скрывает существование аккаунта: дубль приходит без ошибки,
  // но и без identity. Показываем понятное сообщение вместо «проверьте почту».
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      status: "error",
      message: "Пользователь с таким e-mail уже зарегистрирован. Войдите в аккаунт.",
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Аккаунт создан. Мы отправили письмо для подтверждения адреса — перейдите по ссылке из него.",
    };
  }

  return { status: "success", redirectTo: "/account?welcome=1" };
}

export async function requestPasswordResetAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetRequestSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте e-mail.",
      fieldErrors: authFieldErrors(parsed.error, RESET_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site.url}/auth/callback?next=/reset-password/update`,
  });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  // Не подтверждаем существование аккаунта — только факт отправки письма.
  return {
    status: "success",
    message:
      "Если аккаунт с таким e-mail существует, мы отправили ссылку для сброса пароля. Проверьте почту и папку «Спам».",
  };
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте пароль.",
      fieldErrors: authFieldErrors(parsed.error, UPDATE_PASSWORD_FIELDS),
    };
  }

  if (!hasSupabaseEnv()) return missingConfig();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Ссылка для сброса пароля устарела. Запросите новую на странице восстановления.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: describeAuthError(error) };
  }

  return { status: "success", redirectTo: "/account?password=updated" };
}
