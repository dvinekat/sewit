/**
 * Состояние форм авторизации для `useActionState`.
 *
 * Вынесено из `lib/auth/actions.ts`: модуль с `"use server"` может экспортировать
 * только асинхронные функции, поэтому типы и начальное состояние живут здесь.
 */
export interface AuthActionState {
  status: "idle" | "error" | "success";
  /** Общее сообщение под формой. */
  message?: string;
  /** Ошибки конкретных полей; ключ — имя поля FormData. */
  fieldErrors?: Record<string, string>;
  /**
   * Куда перейти после успеха. Переход делает браузер полной загрузкой:
   * так шапка и другие клиентские компоненты гарантированно видят новую cookie.
   */
  redirectTo?: string;
}

export const initialAuthState: AuthActionState = { status: "idle" };
