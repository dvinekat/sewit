import { z } from "zod";

/**
 * Схемы форм авторизации (T-05).
 *
 * Одна схема на клиентскую форму и на серверный экшен: сервер не доверяет
 * браузеру и повторно валидирует всё, что пришло из FormData.
 */

const email = z
  .string()
  .trim()
  .min(1, "Введите e-mail")
  .max(254, "E-mail слишком длинный")
  .pipe(z.email("Похоже, в e-mail опечатка"));

/** Минимум 8 символов — требование Supabase Auth по умолчанию. */
const password = z
  .string()
  .min(8, "Пароль: минимум 8 символов")
  .max(72, "Пароль: максимум 72 символа");

export const loginSchema = z.object({
  email,
  // На входе длину не проверяем: не подсказываем правила чужому паролю.
  password: z.string().min(1, "Введите пароль").max(72, "Пароль слишком длинный"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Имя: минимум 2 символа").max(80, "Имя: максимум 80 символов"),
  email,
  password,
  consent: z.preprocess(
    (value) => value === "on" || value === "true" || value === true,
    z.literal(true, {
      message: "Без согласия на обработку персональных данных регистрация невозможна",
    }),
  ),
});

export const resetRequestSchema = z.object({ email });

export const updatePasswordSchema = z.object({ password });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ResetRequestValues = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export const LOGIN_FIELDS = ["email", "password"] as const;
export const REGISTER_FIELDS = ["name", "email", "password", "consent"] as const;
export const RESET_FIELDS = ["email"] as const;
export const UPDATE_PASSWORD_FIELDS = ["password"] as const;

/**
 * Первая ошибка по каждому полю — в виде, удобном для формы.
 * Ошибки вне известных полей отбрасываются: их показывает общее сообщение.
 */
export function authFieldErrors(
  error: z.ZodError,
  fields: readonly string[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && fields.includes(key) && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
