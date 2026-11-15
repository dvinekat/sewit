import { describe, expect, it } from "vitest";

import { authFieldErrors } from "@/lib/schemas/auth";
import {
  DELETE_ACCOUNT_FIELDS,
  PROFILE_FIELDS,
  deleteAccountSchema,
  profileNameSchema,
} from "@/lib/schemas/profile";

describe("схема имени профиля", () => {
  it("обрезает пробелы и принимает нормальное имя", () => {
    const parsed = profileNameSchema.parse({ name: "  Анна Каренина  " });
    expect(parsed.name).toBe("Анна Каренина");
  });

  it("отклоняет слишком короткое имя", () => {
    const parsed = profileNameSchema.safeParse({ name: " Я " });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(authFieldErrors(parsed.error, PROFILE_FIELDS).name).toContain("минимум 2");
    }
  });

  it("держит границы 2 и 80 символов", () => {
    expect(profileNameSchema.safeParse({ name: "Ан" }).success).toBe(true);
    expect(profileNameSchema.safeParse({ name: "А".repeat(80) }).success).toBe(true);
    expect(profileNameSchema.safeParse({ name: "А".repeat(81) }).success).toBe(false);
  });
});

describe("схема удаления аккаунта", () => {
  const valid = { confirm: "удалить", acknowledge: "on" };

  it("принимает подтверждение с галочкой", () => {
    const parsed = deleteAccountSchema.parse(valid);
    expect(parsed.acknowledge).toBe(true);
    expect(parsed.confirm).toBe("удалить");
  });

  it("не зависит от регистра и пробелов в слове «удалить»", () => {
    expect(deleteAccountSchema.safeParse({ ...valid, confirm: "  УДАЛИТЬ " }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ ...valid, confirm: "Удалить" }).success).toBe(true);
  });

  it("не даёт удалить аккаунт без слова-подтверждения", () => {
    const parsed = deleteAccountSchema.safeParse({ ...valid, confirm: "удаляю" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const errors = authFieldErrors(parsed.error, DELETE_ACCOUNT_FIELDS);
      expect(errors.confirm).toContain("удалить");
      expect(errors.acknowledge).toBeUndefined();
    }
  });

  it("требует осознанную галочку, а не пустое значение", () => {
    const parsed = deleteAccountSchema.safeParse({ confirm: "удалить" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const errors = authFieldErrors(parsed.error, DELETE_ACCOUNT_FIELDS);
      expect(errors.acknowledge).toContain("последствия");
    }
  });

  it("не принимает чужой текст вместо галочки", () => {
    expect(deleteAccountSchema.safeParse({ ...valid, acknowledge: "false" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ ...valid, acknowledge: "нет" }).success).toBe(false);
  });
});
