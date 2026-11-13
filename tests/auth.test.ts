import { describe, expect, it } from "vitest";

import { describeAuthError } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  REGISTER_FIELDS,
  authFieldErrors,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/lib/schemas/auth";

describe("safeNextPath", () => {
  it("пропускает относительный путь с параметрами", () => {
    expect(safeNextPath("/account/favorites?from=card")).toBe("/account/favorites?from=card");
  });

  it("возвращает запасной путь вместо пустого значения", () => {
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath("")).toBe("/account");
  });

  it("не пускает открытый редирект на чужой домен", () => {
    expect(safeNextPath("https://evil.example")).toBe("/account");
    expect(safeNextPath("//evil.example")).toBe("/account");
    expect(safeNextPath("\\\\evil.example")).toBe("/account");
  });

  it("уважает явный fallback", () => {
    expect(safeNextPath("//evil.example", "/catalog")).toBe("/catalog");
  });
});

describe("describeAuthError", () => {
  it("переводит известные коды Supabase Auth", () => {
    expect(describeAuthError({ code: "invalid_credentials" })).toBe("Неверный e-mail или пароль.");
    expect(describeAuthError({ code: "same_password" })).toContain("совпадает");
    expect(describeAuthError({ code: "over_request_rate_limit" })).toContain("Слишком много");
  });

  it("не показывает английский текст неизвестной ошибки", () => {
    expect(describeAuthError({ code: "unexpected_failure", message: "Database error" })).toBe(
      "Не удалось выполнить действие. Попробуйте ещё раз.",
    );
  });

  it("распознаёт ошибку сети", () => {
    expect(describeAuthError({ name: "AuthRetryableFetchError" })).toContain("Нет связи");
    expect(describeAuthError({ status: 0 })).toContain("Нет связи");
  });

  it("возвращает общее сообщение для null", () => {
    expect(describeAuthError(null)).toContain("Попробуйте ещё раз");
  });
});

describe("схема входа", () => {
  it("обрезает пробелы вокруг e-mail", () => {
    const parsed = loginSchema.parse({ email: "  user@sewit.example ", password: "secret123" });
    expect(parsed.email).toBe("user@sewit.example");
  });

  it("требует пароль", () => {
    const parsed = loginSchema.safeParse({ email: "user@sewit.example", password: "" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(authFieldErrors(parsed.error, ["email", "password"]).password).toContain("Введите");
    }
  });

  it("отклоняет e-mail без собаки", () => {
    const parsed = loginSchema.safeParse({ email: "user.example", password: "secret123" });
    expect(parsed.success).toBe(false);
  });
});

describe("схема регистрации", () => {
  const valid = {
    name: " Анна ",
    email: "anna@example.com",
    password: "sew-it-123",
    consent: "on",
  };

  it("принимает форму с согласием и нормализует поля", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed).toMatchObject({
      name: "Анна",
      email: "anna@example.com",
      consent: true,
    });
  });

  it("блокирует регистрацию без согласия на обработку ПД", () => {
    const parsed = registerSchema.safeParse({ ...valid, consent: undefined });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const errors = authFieldErrors(parsed.error, REGISTER_FIELDS);
      expect(errors.consent).toContain("Без согласия");
    }
  });

  it("не принимает короткий пароль", () => {
    const parsed = registerSchema.safeParse({ ...valid, password: "short" });
    expect(parsed.success).toBe(false);
  });
});

describe("смена пароля", () => {
  it("требует минимум 8 символов", () => {
    expect(updatePasswordSchema.safeParse({ password: "1234567" }).success).toBe(false);
    expect(updatePasswordSchema.safeParse({ password: "12345678" }).success).toBe(true);
  });
});
