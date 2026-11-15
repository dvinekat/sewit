/**
 * Состояние админских форм для `useActionState` (T-39–T-42).
 *
 * Модуль с `"use server"` может экспортировать только асинхронные функции,
 * поэтому типы и начальное состояние живут отдельно.
 */
export interface AdminActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const initialAdminState: AdminActionState = { status: "idle" };
