/**
 * Состояние форм профиля для `useActionState` (T-37).
 *
 * Вынесено из `lib/profile/actions.ts`: модуль с `"use server"` может
 * экспортировать только асинхронные функции.
 */
export interface ProfileActionState {
  status: "idle" | "error" | "success";
  /** Общее сообщение под формой. */
  message?: string;
  /** Ошибки конкретных полей; ключ — имя поля FormData. */
  fieldErrors?: Record<string, string>;
  /** Куда перейти после успеха (полная загрузка с очисткой cookie сессии). */
  redirectTo?: string;
}

export const initialProfileState: ProfileActionState = { status: "idle" };
