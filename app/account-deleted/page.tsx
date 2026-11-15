import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Аккаунт удалён",
  description: "Аккаунт SewIt удалён, персональные данные стёрты.",
  robots: { index: false, follow: false },
};

/**
 * Итог удаления аккаунта (T-37, FR-6.5).
 *
 * Отдельная страница вместо возврата на главную: пользователь должен увидеть,
 * что именно стёрто, а что осталось в обезличенном виде.
 */
export default function AccountDeletedPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <p className="font-display text-6xl text-sage/40">✓</p>
      <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">Аккаунт удалён</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        Профиль, мерки и избранное стёрты, доступ к скачиванию выкроек закрыт. История заказов
        осталась обезличенной: в ней нет имени, e-mail и мерок — только состав и суммы.
      </p>

      <div className="mt-8 grid w-full max-w-md gap-3 text-left">
        <div className="rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed">
          <p className="font-medium">Если передумали</p>
          <p className="mt-1 text-muted-foreground">
            Зарегистрируйтесь заново с тем же e-mail — новый аккаунт начнётся с чистого профиля.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 text-sm leading-relaxed">
          <p className="font-medium">Нужен прежний заказ</p>
          <p className="mt-1 text-muted-foreground">
            Номер и состав обезличенного заказа остаются у администратора магазина.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/catalog" className={buttonVariants({ size: "lg" })}>
          Вернуться в каталог
        </Link>
        <Link href="/register" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Зарегистрироваться заново
        </Link>
      </div>
    </div>
  );
}
