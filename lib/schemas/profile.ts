import { z } from "zod";

/**
 * Схемы профиля и удаления аккаунта (T-37, FR-6.5).
 *
 * Одна схема на клиентскую форму и на серверный экшен: удаление аккаунта —
 * необратимая операция, поэтому подтверждение проверяется на сервере заново,
 * а не только в браузере.
 */

/** Имя в профиле: те же правила, что при регистрации (FR-6.1). */
export const profileNameSchema = z.object({
  name: z.string().trim().min(2, "Имя: минимум 2 символа").max(80, "Имя: максимум 80 символов"),
});

/** Слово-подтверждение: регистр и лишние пробелы не важны. */
export const DELETION_CONFIRMATION_WORD = "удалить";

const confirmationWord = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.literal(DELETION_CONFIRMATION_WORD, {
      message: "Чтобы удалить аккаунт, введите слово «удалить»",
    }),
  );

export const deleteAccountSchema = z.object({
  confirm: confirmationWord,
  acknowledge: z.preprocess(
    (value) => value === "on" || value === "true" || value === true,
    z.literal(true, {
      message: "Подтвердите, что понимаете последствия удаления аккаунта",
    }),
  ),
});

export type ProfileNameValues = z.infer<typeof profileNameSchema>;
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;

export const PROFILE_FIELDS = ["name"] as const;
export const DELETE_ACCOUNT_FIELDS = ["confirm", "acknowledge"] as const;
