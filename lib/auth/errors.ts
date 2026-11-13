/**
 * Человекочитаемые ошибки Supabase Auth (FR-6.1, T-05).
 *
 * GoTrue отвечает кодами и английскими сообщениями; в интерфейсе показываем
 * русский текст, а неизвестные коды не раскрываем как есть.
 */

const DEFAULT_MESSAGE = "Не удалось выполнить действие. Попробуйте ещё раз.";
const NETWORK_MESSAGE = "Нет связи с сервером. Проверьте интернет и попробуйте снова.";

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Неверный e-mail или пароль.",
  email_not_confirmed: "E-mail не подтверждён. Откройте письмо и подтвердите адрес.",
  user_already_exists: "Пользователь с таким e-mail уже зарегистрирован.",
  email_exists: "Пользователь с таким e-mail уже зарегистрирован.",
  weak_password: "Пароль слишком простой. Добавьте буквы разного регистра и цифры.",
  over_request_rate_limit: "Слишком много попыток. Подождите минуту и попробуйте снова.",
  over_email_send_rate_limit: "Письма отправляются слишком часто. Подождите минуту.",
  same_password: "Новый пароль совпадает с текущим. Придумайте другой.",
  session_not_found: "Сессия истекла. Войдите снова.",
  refresh_token_not_found: "Сессия истекла. Войдите снова.",
  signup_disabled: "Регистрация временно закрыта.",
  email_address_invalid: "Похоже, в e-mail опечатка.",
};

interface AuthErrorLike {
  code?: unknown;
  status?: unknown;
  name?: unknown;
}

export function describeAuthError(error: unknown): string {
  if (!error) return DEFAULT_MESSAGE;

  if (typeof error === "object" && error !== null) {
    const { code, status, name } = error as AuthErrorLike;

    if (typeof code === "string" && code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[code];
    }

    if (status === 0 || name === "AuthRetryableFetchError") {
      return NETWORK_MESSAGE;
    }
  }

  return DEFAULT_MESSAGE;
}
